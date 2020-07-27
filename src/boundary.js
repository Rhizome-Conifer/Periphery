import { applyStylesToNodes, attachDivOverlay, inlineStyle } from './mutator';
import { cssSelector, linkQuery } from './selector';

export class Boundary {
    constructor(boundary) {
        this.affectedNodes = [];
        if (boundary.resource === undefined || typeof boundary.resource !== 'string') {
            throw new TypeError('Missing / incorrect resource matcher for boundary.')
        }
        this.resource = boundary.resource;

        if (boundary.type !== 'on-load' && boundary.type !== 'mutation-observer') {
            throw new TypeError('Incorrect type for boundary.')
        }
        this.type = boundary.type;
        this.description = boundary.description || '';

        if (boundary.selector === undefined) {
            throw new TypeError('Boundary selector not provided.')
        }
        if (boundary.selector.type !== 'css-selector' && boundary.selector.type !== 'link-query' && boundary.selector.type !== 'link-query-lazy') {
            throw new TypeError('Incorrect boundary selector type.')
        }
        this.selectorType = boundary.selector.type;
        this.selector = boundary.selector.query;
        this.selectorOptions = boundary.selector.options;

        if (boundary.action === undefined) {
            throw new TypeError('Boundary action not provided.')
        }
        if (boundary.action.type !== 'none' && boundary.action.type !== 'disable' && boundary.action.type !== 'style') {
            throw new TypeError('incorrect boundary action type.')
        }
        this.action = boundary.action.type;
        this.actionStyle = boundary.action.style;
        
        this.overlays = boundary.overlays;
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

    /*
        Update the visibility of all overlay elements matching a given overlay ID.
    */
    updateOverlays(overlayId, visibility) {
        this.overlayDivs[overlayId].forEach(function(overlayDiv) {
            overlayDiv.style.visibility = visibility ? 'visible' : hidden;
        })
    }
}




