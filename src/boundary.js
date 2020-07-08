import { OverlayTooltip, Overlay } from './overlay';
import {LitElement, html, css} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map';

import { applyStylesToNodes, attachDivOverlay, inlineStyle } from './mutator';



export class Boundary {
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
            overlayDiv.style.visibility = 'visible';
        })
    }

    hideOverlays(overlayId) {
        this.overlayDivs[overlayId].forEach(function(overlayDiv) {
            overlayDiv.style.visibility = 'hidden';
        })
    }

    applyBoundary(node) {
        let matchedNodes;
        if (this.action == 'inline-style') {
            matchedNodes = inlineStyle(document.head, this.actionStyle, this.selector);
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
    linkQuery(node) {
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

    CSSSelector(node) {
        return new Promise((resolve) => {resolve(node.querySelectorAll(this.selector))});
    }
}




