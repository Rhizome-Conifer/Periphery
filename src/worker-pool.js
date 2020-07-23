export class Pool {
    constructor(size, host, endpoint) {
        this.size = size;
        this.host = host;
        this.endpoint = endpoint;
        this.taskQueue = [];
        this.workerQueue = this.init(size);
        this.tasks = [];
    }

    init() {
        // Create the blob URL for the worker function
        let workerFunc = `
        function checkCdxQueryResult(uri) {
            return fetch(uri).then
            (res => res.text()).then
            (response => response != '');
        }
        
        onmessage = function(e) {
            let host = e.data.host;
            let endpoint = e.data.endpoint;
            let href = e.data.href;
            if (!href.startsWith('javascript')) {
                let url = host + endpoint + "?output=json&limit=1&url=" + encodeURIComponent(href);
                checkCdxQueryResult(url).then((isPresent) => {
                    self.postMessage([href, isPresent]);
                });
            } else {
                // for javascript() hrefs and other things that we know aren't within boundary
                self.postMessage([href, false]);
            }
        };
        `;
        let blob = new Blob([workerFunc], { type: 'application/javascript' });
        var url = URL.createObjectURL(blob);

        let workerThreads = [];
        for (let i=0;i<this.size;i++) {
            workerThreads.push(new WorkerThread(this.host, this.endpoint, url, this.freeThread.bind(this)));
        }
        return workerThreads;
    }

    processInput(input) {
        let tasks = []
        input.forEach(function(val) {
            tasks.push(new Promise(function(resolve) {
                this.addTask(val, function(res) {
                    resolve(res);
                })
            }.bind(this)))
        }.bind(this));

        return tasks; 
    }

    addTask(msg, callback) {
        if (this.workerQueue.length > 0) {
            let workerThread = this.workerQueue.shift();
            workerThread.run(new WorkerTask(msg, callback));
        } else {
            this.taskQueue.push(new WorkerTask(msg, callback));
        }
    }

    freeThread(workerThread) {
        if (this.taskQueue.length > 0 ) {
            let newTask = this.taskQueue.shift();
            workerThread.run(newTask);
        } else {
            this.workerQueue.push(workerThread);
        }
    }
}

class WorkerThread {
    constructor(host, endpoint, blobURL, freeThread) {
        this.worker = new Worker(blobURL);
        this.host = host;
        this.endpoint = endpoint;
        this.freeThread = freeThread;
    }

    run(task) {
        this.worker.onmessage = (val) => {
            task.callback(val);
            this.freeThread(this);
        }
        this.worker.postMessage({host: this.host, endpoint: this.endpoint, href: task.message});
    }
}

function WorkerTask(msg, callback) {
    this.message = msg;
    this.callback = callback;
}