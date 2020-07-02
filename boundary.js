import { OverlayTooltip } from './overlay-tooltip.js';

class Boundary {
    constructor(boundary) {
        this.affectedNodes = [];
        this.type = boundary.type || 'on-load';
        this.description = boundary.description || '';

        this.selectorType = boundary.selector.type;
        this.selector = boundary.selector.query;

        this.action = boundary.action.type;
        this.actionStyle = boundary.action.style;
        
        this.overlays = boundary.overlays;

        this.selectorFuncs = {
            'css-selector': this.CSSSelector,
            'link-query': this.linkQuery
        }

    }

    /*
        Update the list of overlay nodes for the boundary based on the removedNodes from a mutationRecord
    */
    clearRemovedNodes(removedNodes) {
        removedNodes.forEach(function(node) {
            let idx = this.affectedNodes.indexOf(node)
            if (idx !== -1) {
                this.affectedNodes.splice(idx, 1);
            }
        }.bind(this));
    }

    /*
        Given a list of nodes recently added to the DOM, update the list of affected nodes
    */
    pushAddedNodes(addedNodes) {
        addedNodes.forEach(function(node) {
            // TODO figure out whether there's actually any situation in which this check is needed
            if (this.affectedNodes.indexOf(node) == -1) {
                this.affectedNodes.push(node);
            }
        }.bind(this));
    }

    createOverlays(nodes) {
        // TODO determine whether overlayDivs should be separate for separate overlays (e.g. box vs. tooltip)
        if (this.overlayDivs == undefined) {
            this.overlayDivs = {};
        }
        this.overlays.forEach(function(overlay, idx) {
            let overlayId = 'overlay-display-' + this.idx + idx;

            let className = overlay.type == 'tooltip' ? 'overlay-tooltip' : 'overlay';
            let desc = overlay.type == 'tooltip' ? this.description : null;
            this.overlayDivs[overlayId] = [];

            nodes.forEach(function (node) {
                // TODO change class name
                let overlayDiv = attachDivOverlay(node, className, desc, overlay.styles);
                this.overlayDivs[overlayId].push(overlayDiv);
                node.style.position = 'relative';
            }.bind(this));   

            if (overlay.display == 'visible') {
                this.showOverlays(overlayId);
            } 
        }.bind(this));
    }

    showOverlays(overlayId) {
        this.overlayDivs[overlayId].forEach(function(overlayDiv) {
            overlayDiv.style.opacity = 1;
        })
    }

    hideOverlays(overlayId) {
        this.overlayDivs[overlayId].forEach(function(overlayDiv) {
            overlayDiv.style.opacity = 0;
        })
    }

    applyBoundary(node) {
        let matchedNodes;
        if (this.action == 'inline-style') {
            matchedNodes = inlineStyle(document.head);
        } else {
            let selectorFunc = this.selectorFuncs[this.selectorType].bind(this);
            matchedNodes = selectorFunc(node).then(function(nodes) {
                if (this.action == 'disable') {
                    this.actionStyle = {'pointer-events': 'none'};
                }
                applyStylesToNodes(nodes, this.actionStyle);
                return nodes;
            }.bind(this));
        }
        // Update the list of added nodes, and attach overlays if applicable
        matchedNodes.then(function(nodes) {
            this.pushAddedNodes(nodes);
            if (this.overlays !== undefined) {
                this.createOverlays(nodes);
            }
        }.bind(this));    
    }

    /*
        Builds a valid CSS style based on an object containing CSS attribuets in key-value pairs, and adds it to the DOM in a <style> element.
    */
    inlineStyle(node) {
        let attributes = JSON.stringify(this.actionStyle).split(',').join(';');
        let styleString = this.selector + ' ' + attributes.split('\"').join('');

        let style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(styleString));
        node.appendChild(style);
    };

    cdxQuery(uri) {
        return fetch(uri).then
        (res => res.text()).then
        (response => response != '');
    }

    /*
        Queries backend CDX server to determine whether a given resource exists in the archive.
        link: A Node containing the href to check
    */
    queryResource(link) {
        let node = link;
        let href = node.href;
        if (!href.startsWith('javascript')) {
            let url = host + "cdx?output=json&url=" + encodeURIComponent(href);
            return this.cdxQuery(url).then(isPresent => isPresent);
        } else {
            // for javascript() hrefs and other things that we know aren't within boundary
            return new Promise((resolve) => resolve(false));
        }
    }

    /*
        Selects all elements with href attribute and queries whether they point to an in-boundary resource
    */
    linkQuery = function(node) {
        if (node && node.nodeType === Node.ELEMENT_NODE) {
            let allLinks = []
            node.querySelectorAll('[href]').forEach(function (elem) {
                // create structure containing links and whether they're within boundary
                allLinks.push(this.queryResource(elem)
                .then((isPresent) => {
                    return [elem, isPresent]
                }))
            }.bind(this));

            return Promise.all(allLinks).then((nodes) => {
                let affectedNodes = []
                nodes.forEach((nodeVal) => {
                    let [node, isPresent] = nodeVal;
                    if (!isPresent) {
                        affectedNodes.push(node);
                    }
                })
                return affectedNodes;
            })
        }
    }

    CSSSelector = function(node) {
        return new Promise((resolve) => {resolve(node.querySelectorAll(this.selector))});
    }
}

module.exports = {
    Boundary: Boundary
};

/*
Applies an object with CSS style key-value pairs to a list of nodes.
nodes: a NodeList or array containing the nodes to which to apply styling.
styles: an object containing key-value pairs representing CSS attributes.
*/
module.exports.applyStylesToNodes = (nodes, styles) => {
    nodes.forEach(function(node) {
        Object.keys(styles).forEach(function (key) {
            node.style[key] = styles[key];
        });
    })
}

module.exports.attachDivOverlay = (elem, className, description, styling) => {
    let overlay;
    if (className == 'overlay-tooltip') {
        if (customElements.get('overlay-tooltip') == undefined) {
            customElements.define('overlay-tooltip', OverlayTooltip);
        }
        overlay = document.createElement("overlay-tooltip");
    } else {
        overlay = document.createElement("div");
        overlay.className = className;
    }
    if (description) {
        overlay.setAttribute('data-after', description);
    }
    if (styling) {
        applyStylesToNodes([overlay], styling);
    }
    elem.appendChild(overlay);
    return overlay;
}



