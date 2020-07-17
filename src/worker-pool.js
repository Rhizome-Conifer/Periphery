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
            workerThreads.push(new WorkerThread(this.script, this.freeThread));
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
            }))
        })    
        return Promise.all(tasks).then((vals) => vals);
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
    constructor(script, freeThread) {
        this.worker = new Worker(script);
        this.freeThread = freeThread;
    }

    run(task) {
        this.worker.onmessage = (msg) => {
            task.callback(msg);
            this.freeThread(this);
            this.worker.terminate();
        }
        this.worker.postMessage(task.message);
    }
}

function WorkerTask(msg, callback) {
    this.msg = msg;
    this.callback = callback;
}