
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
            workerThreads.push(new WorkerThread(this.freeThread));
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
        return Promise.all(tasks).then((vals) => {console.log(vals); return vals});
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
        let workerFunc = `function checkCdxQueryResult(uri) {
            return fetch(uri).then
            (res => res.text()).then
            (response => response != '');
        }
        
        onmessage = function(e) {
            console.log('received message');
            let href = e.data;
            console.log(href);
            checkCdxQueryResult(href).then((isPresent) => {
                console.log(isPresent);
                self.postMessage([href, isPresent]);
            })
        };
        `;

        let blob = new Blob([workerFunc], { type: 'application/javascript' });
        var url = URL.createObjectURL(blob);
        this.worker = new Worker(url);
        URL.revokeObjectURL(url);
        this.freeThread = freeThread;
    }

    run(task) {
        console.log(this.worker)
        this.worker.onmessage = (val) => {
            console.log(val);
            task.callback(val);
            this.freeThread(this);
        }
        this.worker.postMessage(task.message);
    }
}

function WorkerTask(msg, callback) {
    this.message = msg;
    this.callback = callback;
}