// let boundaryList = require('./boundary-list');
// let boundary = require('./boundary');
// let overlayToolti = require('./overlay-tooltip');


import {LitElement, html, css} from 'lit-element';
import {BoundaryList} from './boundary-list'

export class BoundarySidebar extends LitElement {
    static get styles() {
        return css`
            #sidebar-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
      
            #boundary-sidebar {
                background-color: white;
                z-index: 9999;
                width: 200px;
                height: 100%;
                position: fixed;
                right: 0;
                transform: translateX(420px);
                transition: transform 250ms ease-in-out;
                border-left: 1px solid black;
            }
      
            .sidebar-check {
                width: 30px;
                height: 30px;
                background-color: white;
                border: 1px solid black;
                text-align: center;
                line-height: 30px;
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
            }
      
            .sidebar-toggle-icon {
                position: fixed;
                bottom: 50px;
                right: 50px;
                z-index: 10000;
            }
        
            ul#boundary-list {
                display: flex;
                flex-direction: column;
                padding: 0;
            }
        
            #sidebar-toggle:checked ~ #boundary-sidebar {
                transform: translateX(0);
            }
        
            #sidebar-toggle {
                display: none;
            }
        
            .boundary {
                list-style: none;
                background-color: #ffffff;
                border: 1px solid black;
                padding: 5px;
                margin: 10px;
                display: inline-block;
                position: relative;
                max-height: 40px;
                height: auto;
                transition: max-height 300ms ease-in-out;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
            }
        
            .boundary:focus, .boundary.focus {
                max-height: 500px;
            }
        
            .boundary:hover {
                border: 3px solid black;
                padding: 3px;
            }
        
            .boundary-description {
                margin: 0 0 10px;
            }
        
            .boundary-title {
                font-weight: bold;
            }
        
            .overlay-root {
                position: fixed;
                top: 0px;
                left: 0px;
            }
        
            .default-overlay {
                background-color: rgba(0,0,0,0.5);
                position: absolute;
                z-index: 9998;
            }
        `;
    }

    static get properties() {
        return {
            boundaries: {attribute: false},
        }
    }

    set boundaries(value) {
        let oldVal = this._boundaries;
        this._boundaries = new BoundaryList(value);
        this.requestUpdate('boundaries', oldVal);
    }

    constructor() {
        super();
        this._boundaries = [];
        this._boundaryOverlays = {};
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
    handleBoundaryFocus(boundary) {
        console.log(boundary)
        let container = this.shadowRoot.getElementById('sidebar-container');
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

    render() {
        return html`
        <div id="sidebar-container">
            <input type="checkbox" id="sidebar-toggle">
            <label for="sidebar-toggle" class="sidebar-toggle-icon">
                <div class="sidebar-check">i</div>
            </label>
            <div id="boundary-sidebar">
                <ul id="boundary-list">
                    ${this._boundaries.boundaries === undefined ? html`` : this._boundaries.boundaries.map((boundary) => 
                        html`<li class="boundary" 
                                tab-index="1" 
                                @mouseenter=${(e) => {this.handleBoundaryFocus(boundary)}} 
                                @mouseexit=${(e) => {this.handleBoundaryBlur(boundary)}}>
                            <div class="boundary-title">${boundary.action}</div>
                            <div class="boundary-description">${boundary.description}</div>
                            <div class="boundary-contents">
                                ${boundary.overlays == undefined ? html`` : 
                                    html`
                                        <div class="boundary-overlay">
                                            Overlays visible: 
                                        </div>
                                        ${boundary.overlays.map((overlay, idx) => html`
                                            <label 
                                                for=${'overlay-display-' + boundary.idx + idx}>
                                                ${overlay.type}
                                            </label>
                                            <input type='checkbox' id=${'overlay-display-' + boundary.idx + idx}></input>
                                        `)}`}
                                <div class="overlay-root"></div>
                            </div>
                        </li>`)}
                </ul>
            </div>    
        </div>`;
    }
}

customElements.define('boundary-sidebar', BoundarySidebar);
