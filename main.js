
import { BoundaryList } from './boundary-list.js';
import { applyStylesToNodes, attachDivOverlay } from './boundary.js';
import { OverlayTooltip } from './overlay-tooltip.js';

class BoundarySidebar extends HTMLElement {
    constructor() {
        super();
        this._boundaries = {};
        this._boundaryOverlays = {};
        let shadowRoot = this.attachShadow({mode: 'open'});
        let tmpl = document.getElementById('boundary-sidebar-template'); 
        shadowRoot.appendChild(tmpl.content.cloneNode(true));
    }

    get boundaries() {
        return this._boundaries;
    }

    set boundaries(boundaries) {
        this._boundaries = boundaries;
    }

    /*
        Handle onclick for boundary visibility checkbox
    */
    onCheck(elem, boundary, overlayId) {
        if (elem.checked) {
            boundary.showOverlays(overlayId);
        } else {
            boundary.hideOverlays(overlayId);
        }
    }
    
    // TODO: figure out whether this function should live here

    /*
        Create default-display (on hover) overlays corresponding to a boundary's affected elements.
        @parameter boundary: the Boundary object corresponding to the element on which the event was fired
        @parameter elem: the overlay container element corresponding to the Boundary
        @parameter container: the sidebar container element
    */
    applyDefaultOverlays(boundary, elem, container) {
        if (boundary.affectedNodes !== undefined) {
            let boundaryRect = container.getBoundingClientRect();
            boundary.affectedNodes.forEach((node) => {
                let rect = node.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    let styles = {
                        'width': rect.width + 'px',
                        'height': rect.height + 'px',
                        'top': (rect.y - boundaryRect.y) + 'px',
                        'left': (rect.x - boundaryRect.x) + 'px'
                    };
                    attachDivOverlay(elem, 'default-overlay', null, styles);
                }
            })
        }
    }

    /*
        Handle mouse enter / focus event for a given boundary sidebar element.
        @param boundary: the Boundary object corresponding to the element the event was fired on
        @param container: a reference to the sidebar container element
    */
    handleBoundaryFocus(boundary, container) {
        if (this._boundaryOverlays[boundary.idx] === undefined) {
            let overlayRoot = document.createElement('div');
            overlayRoot.class = 'overlay-root';
            container.appendChild(overlayRoot);
            this._boundaryOverlays[boundary.idx] = overlayRoot;
        }

        let root = this._boundaryOverlays[boundary.idx];
        if (root !== undefined) {
            if (root.querySelector('.default-overlay') == null) {
                // TODO determine whether this needs to check to see whether boundary.affectedNodes has been updated
                this.applyDefaultOverlays(boundary, root, container);
            }
            root.querySelectorAll('.default-overlay').forEach(function(node) {
                node.style.display = 'block';
            })
        }
    }

    /*
        Handle mouse leave / blur event for a given boundary.
        @param boundary: the Boundary object representing the boundary whose corresponding element the event was fired on.
    */
    handleBoundaryBlur(boundary) {
        let root = this._boundaryOverlays[boundary.idx];
        if (root !== undefined) {           
            root.querySelectorAll('.default-overlay').forEach(function(node) {
                node.style.display = 'none';
            })
        }
    }

    /*
        Populate the boundary element with inputs representing overlays
    */
    populateOverlayList(boundary, boundaryElem) {
        let overlayElem = boundaryElem.querySelector('.boundary-overlay');
        boundary.overlays.forEach(function(overlay, idx) {
            let overlayId = 'overlay-display-' + boundary.idx + idx;
            let label = document.createElement('label');
            label.for = overlayId;
            label.innerHTML = overlay.type;
            overlayElem.appendChild(label);

            let overlayDisplay = document.createElement('input');
            overlayDisplay.id = overlayId;
            overlayDisplay.type = 'checkbox';
            overlayDisplay.addEventListener('focus', () => {boundaryElem.classList.add('focus')});
            overlayDisplay.addEventListener('blur', () => {boundaryElem.classList.remove('focus')});
            overlayDisplay.checked = overlay.display == 'visible';
            overlayDisplay.onclick = () => {this.onCheck(overlayDisplay, boundary, overlayId)};
            overlayElem.appendChild(overlayDisplay);
        }.bind(this))
    }

    /*
        Populate the boundary sidebar with elements corresponding to each boundary.
    */
    populateBoundaryList() {
        let outerFrame = this.shadowRoot.getElementById('boundary-list');
        let container = this.shadowRoot.getElementById('sidebar-container');
        this._boundaries.forEach(function(boundary, idx) {
            boundary.idx = idx;
            if ('content' in document.createElement('template')) {
                let boundaryTemplate = document.querySelector('#boundary-template').content;
                let boundaryElem = boundaryTemplate.children[0].cloneNode(true);
                boundaryElem.tabIndex = '1';
                outerFrame.appendChild(boundaryElem);
                boundaryElem.addEventListener('mouseenter', function(event) {
                    this.handleBoundaryFocus(boundary, container);
                }.bind(this));
                boundaryElem.addEventListener('mouseleave', function() {
                    this.handleBoundaryBlur(boundary);
                }.bind(this))
        
                let title = boundaryElem.querySelector('.boundary-title');
                title.innerHTML = boundary.action;
        
                if (boundary.description !== undefined) {
                    boundaryElem.querySelector('.boundary-description').innerHTML = boundary.description;
                }
            
                if (boundary.overlays !== undefined) {
                    this.populateOverlayList(boundary, boundaryElem);
                }
                
            }    
        }.bind(this))
    }
}

customElements.define('boundary-sidebar', BoundarySidebar);
customElements.define('overlay-tooltip', OverlayTooltip);


/* 
    Once DOM content is loaded, apply boundaries
*/
document.addEventListener("DOMContentLoaded", () => {
    var boundaries = new BoundaryList(meta);
    boundaries.applyBoundaries();
    let sidebar = document.querySelector('boundary-sidebar');
    sidebar.boundaries = boundaries.getBoundaries();
    sidebar.populateBoundaryList();
});