import { Boundary } from './boundary';
import { cssSelector, linkQuery, linkQueryLazy } from './selector';
import { applyStylesToNodes, attachDivOverlay } from './mutator';

export class BoundaryList {
    constructor(boundaries) {
        this.boundaries = [];
        if (boundaries !== undefined) {
            boundaries.forEach(function(boundary, idx) {
                let boundaryObject = new Boundary(boundary);
                boundaryObject.idx = idx;
                this.boundaries.push(boundaryObject);
            }.bind(this))    
        }
    }

    /*
        Creates elements corresponding to a boundary's overlays.
        @param boundary: the given Boundary object.
    */
   createOverlays(boundary) {
        if (boundary.overlayDivs == undefined) {
            boundary.overlayDivs = {};
        }
        boundary.overlays.forEach(function(overlay, idx) {
            let overlayId = 'overlay-display-' + boundary.idx + idx;

            let className = overlay.type == 'tooltip' ? 'overlay-tooltip' : 'overlay';
            let desc = overlay.type == 'tooltip' ? boundary.description : null;
            boundary.overlayDivs[overlayId] = [];

            boundary.affectedNodes.forEach(function (node) {
                let overlayDiv = attachDivOverlay(node, className, desc, overlay.styles);
                boundary.overlayDivs[overlayId].push(overlayDiv);
                node.style.position = 'relative';
            });   

            if (overlay.display == 'visible') {
                boundary.showOverlays(overlayId);
            } 
        });
    }

    performBoundaryAction(boundary, nodes) {
        if (boundary.action == 'disable') {
            boundary.actionStyle = {'pointer-events': 'none'};
        }
        applyStylesToNodes(nodes, boundary.actionStyle);
        return nodes;
    }

    /*
        Apply a given boundary, performing the relevant DOM modifications.
        @param boundary: the given Boundary object
        @param node: the root DOM node from which to apply the boundary
    */
    applyBoundary(boundary, node) {
        let selectorFuncs = {
            'css-selector': cssSelector,
            'link-query': linkQuery
        }
        let matchedNodes;

        if (boundary.action == 'inline-style') {
            matchedNodes = inlineStyle(document.head, boundary.actionStyle, boundary.selector);
        } else {
            matchedNodes = selectorFuncs[boundary.selectorType](node, boundary).then(function(nodes) {
                this.performBoundaryAction(boundary, nodes);
            }.bind(this));
        }
        // Update the list of added nodes, and attach overlays if applicable
        return matchedNodes.then(function(nodes) {
            boundary.pushAddedNodes(nodes);
            if (boundary.overlays !== undefined) {
                this.createOverlays(boundary);
            }
            return boundary;
        }.bind(this));    
    }

    /*
        Apply all boundary functions and create overlays, if applicable.
    */
    applyBoundaries(onLoadCallback) {
        let observerBoundaries = [];
        let runningBoundaries = [];
        // Should always apply boundaries once on DOM load, whether or not the boundary is 'observer' type or not
        this.boundaries.forEach(function (boundary) {
            if (boundary.selectorType === 'link-query-lazy') {
                linkQueryLazy(document.body, boundary, function(node) {
                    console.log(node);
                    performBoundaryAction(boundary, node);
                    boundary.pushAddedNodes(node);
                })
            }
            if (boundary.type == 'observer') {
                observerBoundaries.push(boundary);
            }
            let boundaryStatus = this.applyBoundary(boundary, document.body);
            runningBoundaries.push(boundaryStatus);
            boundaryStatus.then((boundary) => {
                if (onLoadCallback) {
                    onLoadCallback(boundary);
                }
            });   
        }.bind(this));

    
        if (observerBoundaries.length > 0) {
            let observerOptions = {
                childList: true,
                subtree: true
            }        
            let mutationCallback = this.getMutator(observerBoundaries);
            let observer = new MutationObserver(mutationCallback);
            observer.observe(document.body, observerOptions);
        }
        return Promise.all(runningBoundaries).then(() => true);
    }

    /*
        Returns a callback function to be passed into the mutationObserver object when creating it.
        @param callbackFunc: the specific func to be applied to the added nodes, which should accept a Node object and a boundary object
    */ 
    getMutator(observerBoundaries) {
        return function(mutationList) {
            mutationList.forEach(function (mutation) {
                if (mutation.type == 'childList') {
                    // To all added nodes, apply any applicable boundaries
                    mutation.addedNodes.forEach(function (node) {
                        observerBoundaries.forEach(function(boundary) {
                            this.applyBoundary(boundary, node);
                        }.bind(this));
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