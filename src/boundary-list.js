import { Boundary } from './boundary';
import { cssSelector, linkQuery } from './selector';
import { applyStylesToNodes, attachDivOverlay } from './mutator';

export class BoundaryList {
    constructor(boundaries, host, cdxEndpoint) {
        this.boundaries = [];
        this.host = host;
        this.cdxEndpoint = cdxEndpoint;
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
        @param nodes: the nodes to which to attach boundaries.
        @param boundary: the given Boundary object.
    */
   createOverlays(nodes, boundary) {
        if (boundary.overlayDivs == undefined) {
            boundary.overlayDivs = {};
        }
        boundary.overlays.forEach(function(overlay, idx) {
            let overlayId = 'overlay-display-' + boundary.idx + idx;

            let className = overlay.type == 'tooltip' ? 'overlay-tooltip' : 'overlay';
            let desc = overlay.type == 'tooltip' ? boundary.description : null;
            if (boundary.overlayDivs[overlayId] === undefined) {
                boundary.overlayDivs[overlayId] = [];
            }

            nodes.forEach(function (node) {
                let overlayDiv = attachDivOverlay(node, className, desc, overlay.styles);
                boundary.overlayDivs[overlayId].push(overlayDiv);
                node.style.position = 'relative';
            });   

            if (overlay.display == 'visible') {
                boundary.showOverlays(overlayId);
            } 
        });
    }

    performBoundaryAction(nodes, boundary) {
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
    applyBoundary(node, boundary) {
        let selectorFuncs = {
            'css-selector': cssSelector,
            'link-query': linkQuery
        }
        let matchedNodes;

        if (boundary.action == 'inline-style') {
            matchedNodes = inlineStyle(document.head, boundary.actionStyle, boundary.selector);
        } else {
            matchedNodes = selectorFuncs[boundary.selectorType](node, boundary.selector, this.host, this.cdxEndpoint).then(function(nodes) {
                if (nodes !== null)
                return this.performBoundaryAction(nodes, boundary);
            }.bind(this));
        }
        // Update the list of added nodes, and attach overlays if applicable
        return matchedNodes.then(function(nodes) {
            boundary.pushAddedNodes(nodes);
            if (boundary.overlays !== undefined) {
                this.createOverlays(nodes, boundary);
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

            let hrefMatch = null;
            if (boundary.resource !== 'all') {
                // If the resource string doesn't contain a wildcard, we want to match the string exactly
                // Note that we can't match the beginning of the string because of URL rewriting
                let wildcardVal = boundary.resource.indexOf('*') === -1 ? '$' : ''; 
                let re = new RegExp(boundary.resource + wildcardVal);
                hrefMatch = window.location.href.match(re);
            }

            if (hrefMatch !== null || boundary.resource === 'all') {
                if (boundary.selectorType === 'link-query-lazy') {
                    linkQueryLazy(boundary, document.body, this.host, this.cdxEndpoint, function(node) {
                        this.performBoundaryAction([node], boundary);
                        boundary.pushAddedNodes([node]);
                        if (boundary.overlays !== undefined) {
                            this.createOverlays([node], boundary);
                        }
                    }.bind(this));
                    onLoadCallback(boundary);
                } else {
                    if (boundary.type == 'observer') {
                        observerBoundaries.push(boundary);
                    }
                    let boundaryStatus = this.applyBoundary(document.body, boundary);
                    runningBoundaries.push(boundaryStatus);
                    boundaryStatus.then((boundary) => {
                        if (onLoadCallback) {
                            onLoadCallback(boundary);
                        }
                    });       
                }        
            }
            
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
                            this.applyBoundary(node, boundary);
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