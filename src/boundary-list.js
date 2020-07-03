import { Boundary } from './boundary.js';

export class BoundaryList {
    constructor(boundaries) {
        this.boundaries = [];
        if (boundaries !== undefined) {
            boundaries.forEach(function(boundary) {
                this.boundaries.push(new Boundary(boundary));
            }.bind(this))    
        }
    }

    getBoundaries() {
        return this.boundaries;
    }

    applyBoundaries() {
        let observerBoundaries = [];
        // Should always apply boundaries once on DOM load, whether or not the boundary is 'observer' type or not
        this.boundaries.forEach(function (boundary) {
            if (boundary.type == 'observer') {
                observerBoundaries.push(boundary);
            }
            boundary.applyBoundary(document.body);   
        });
    
        if (observerBoundaries.length > 0) {
            let observerOptions = {
                childList: true,
                subtree: true
            }        
            let mutationCallback = this.getMutator(boundaryFuncs);
            let observer = new MutationObserver(mutationCallback);
            observer.observe(document.body, observerOptions);
        }
    }

    /*
        Returns a callback function to be passed into the mutationObserver object when creating it.
        @param callbackFunc: the specific func to be applied to the added nodes, which should accept a Node object and a boundary object
    */ 
    getMutator(observerBoundaries) {
        return function(mutationList, _) {
            mutationList.forEach(function (mutation) {
                if (mutation.type == 'childList') {
                    // To all added nodes, apply any applicable boundaries
                    mutation.addedNodes.forEach(function (node) {
                        observerBoundaries.forEach(function(boundary) {
                            boundary.applyBoundary(node);
                        })
                    });
                                        
                    // For removed nodes, if they're part of a boundary, remove them from the list of affected nodes
                    if (mutation.removedNodes.length > 0) {
                        observerBoundaries.forEach(function(boundary) {
                            boundary.clearRemovedNodes(mutation.removedNodes);
                        })
                    }
                }
            });
        }
    }
}