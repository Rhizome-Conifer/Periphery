/*
    Based on the thread pool JS implementation here: http://www.smartjava.org/content/html5-easily-parallelize-jobs-using-web-workers-and-threadpool/
*/
export class Pool {
    constructor(size, host, endpoint) {
        this.size = size;
        this.host = host;
        this.endpoint = endpoint;
        this.taskQueue = [];
        this.workerQueue = this.init(size);
        this.tasks = [];
    }

    /*
        Initializes worker threads and create a blob for the Worker script
    */
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
        };`;

        // Use a Blob URL to avoid conflicts with Wombat worker rewriting
        let blob = new Blob([workerFunc], { type: 'application/javascript' });
        var url = URL.createObjectURL(blob);

        let workerThreads = [];
        for (let i=0;i<this.size;i++) {
            workerThreads.push(new WorkerThread(this.host, this.endpoint, url, this.freeThread.bind(this)));
        }
        return workerThreads;
    }

    /*
        Add a single input item to the task queue, returning a Promise that resolves once the item has been queried
        @param val: the href to query
    */
    processSingle(val) {
        return new Promise(
            function(resolve) {
                this.addTask(val, function(res) {
                    resolve(res);
                })
            }
        .bind(this));
    }

    /*
        Process an input array, returning an array of Promises corresponding to the inputs being processed.
        @param input: the array of inputs to process
    */
    processInput(input) {
        let tasks = [];
        input.forEach(function(val) {
            tasks.push(this.processSingle(val))
        }.bind(this));
        return tasks; 
    }

    /*
        Add a new task to the task queue.
        @param msg: the message containing data to be processed
        @param callback: the callback to be called once data has finished processing
    */
    addTask(msg, callback) {
        if (this.workerQueue.length > 0) {
            let workerThread = this.workerQueue.shift();
            workerThread.run(new WorkerTask(msg, callback));
        } else {
            this.taskQueue.push(new WorkerTask(msg, callback));
        }
    }

    /*
        Given a recently-completed worker, assigns it a new task if there is one, and if not puts the worker thread in the queue of available threads.
        @param workerThread: the WorkerThread that has just finished processing.
    */
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

    /*
        Run a given WorkerTask.
        @param task: the WorkerTask to complete.
    */
    run(task) {
        // On worker finish, call the callback and free the worker thread
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