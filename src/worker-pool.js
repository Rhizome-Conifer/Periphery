export class Pool {
    constructor(size, script) {
        this.size = size;
        this.script = script;
        this.taskQueue = [];
        this.workerQueue = this.init(size);
    }

    init(size) {
        let workerThreads = [];
        for (let i=0;i<size;i++) {
            workerThreads.push(new WorkerThread(this.freeThread.bind(this)));
        }
        return workerThreads;
    }

    processInput(input) {
        let tasks = [];
        input.forEach(function(val) {
            tasks.push(new Promise(function(resolve) {
                this.addTask(val, function(res) {
                    resolve(res);
                })
            }.bind(this)))
        }.bind(this));
        return Promise.all(tasks).then((vals) => {return vals});
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
    constructor(freeThread) {
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
        this.worker = new Worker(url);
        URL.revokeObjectURL(url);
        this.freeThread = freeThread;
    }

    run(task) {
        this.worker.onmessage = (val) => {
            task.callback(val);
            this.freeThread(this);
        }
        this.worker.postMessage({host: task.message.host, endpoint: task.message.endpoint, href: task.message.href});
    }
}

function WorkerTask(msg, callback) {
    this.message = msg;
    this.callback = callback;
}