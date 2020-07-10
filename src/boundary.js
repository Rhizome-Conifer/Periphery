import { applyStylesToNodes, attachDivOverlay, inlineStyle } from './mutator';
import { cssSelector, linkQuery } from './selector';

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
        Show all overlay elements matching a given overlay ID.
    */
    showOverlays(overlayId) {
        this.overlayDivs[overlayId].forEach(function(overlayDiv) {
            overlayDiv.style.visibility = 'visible';
        })
    }

    /*
        Hide all overlay elements matching a given overlay ID.
    */
    hideOverlays(overlayId) {
        this.overlayDivs[overlayId].forEach(function(overlayDiv) {
            overlayDiv.style.visibility = 'hidden';
        })
    }
}




