import {LitElement, html, css} from 'lit-element';
import {classMap} from 'lit-html/directives/class-map';
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
            boundaryElemClasses: {attribute: false},
            boundaryDefaultOverlays: {attribute: false}
        }
    }

    set boundaries(value) {
        let oldVal = this._boundaries;
        this._boundaries = new BoundaryList(value);
        this._boundaries.applyBoundaries();

        // Set up stylng for overlay divs and UI list element
        this._boundaries.boundaries.forEach((boundary) => {
            this.boundaryElemClasses[boundary.idx] = {"boundary": true};
            this.boundaryDefaultOverlays[boundary.idx] = false;
        })
        this.requestUpdate('boundaries', oldVal);
    }

    constructor() {
        super();
        this._boundaries = [];
        this._boundaryOverlays = {};
        this.boundaryElemClasses = {};
        this.boundaryDefaultOverlays = {};
    }

    /*
        Handle onclick for boundary visibility checkbox
    */
    onCheck(elem, boundary, overlayId) {
        // TODO migrate this method to new LitElement format
        if (elem.checked) {
            boundary.showOverlays(overlayId);
        } else {
            boundary.hideOverlays(overlayId);
        }
    }
    

    /*
        Create default-display (on hover) overlays corresponding to a boundary's affected elements.
        @parameter boundary: the Boundary object corresponding to the element on which the event was fired
        @parameter elem: the overlay container element corresponding to the Boundary
        @parameter container: the sidebar container element
    */
    defaultOverlays(boundary) {
        if (boundary.affectedNodes !== undefined) {
            let boundaryRect = this.shadowRoot.querySelector('#boundary-sidebar').getBoundingClientRect();
            return html`
                ${boundary.affectedNodes.map((node) => {
                    let rect = node.getBoundingClientRect();
                    let styles = {
                        'width': rect.width + 'px',
                        'height': rect.height + 'px',
                        'top': (rect.y - boundaryRect.y) + 'px',
                        'left': (rect.x - boundaryRect.x) + 'px',
                        'visibility': this.boundaryDefaultOverlays[boundary.idx] ? 'visible' : 'hidden'
                    };
                    return rect.width > 0 && rect.height > 0 ? html`
                        <boundary-overlay 
                            style=${styles}
                            className='boundary'
                        >
                        </boundary-overlay>
                    ` : html``;
                })}
            `
        }
    }

    /*
        Handle mouse enter / focus event for a given boundary sidebar element.
        @param boundary: the Boundary object corresponding to the element the event was fired on
        @param container: a reference to the sidebar container element
    */
    handleBoundaryFocus(boundary) {
        this.boundaryDefaultOverlays[boundary.idx] = true;
        this.requestUpdate();
    }

    /*
        Handle mouse leave / blur event for a given boundary.
        @param boundary: the Boundary object representing the boundary whose corresponding element the event was fired on.
    */
    handleBoundaryBlur(boundary) {
        this.boundaryDefaultOverlays[boundary.idx] = false;
        this.requestUpdate();
    }

    /*
        Returns input elements corresponding to a boundry's overlays
        @param boundary: 
    */
    overlayList(boundary) {
        return html`
        <div class="boundary-overlay">
            Overlays visible: 
        </div>
        ${boundary.overlays.map((overlay, idx) => {
            let overlayId = 'overlay-display-' + boundary.idx + idx;
            return html`
            <label 
                for=${overlayId}>
                ${overlay.type}
            </label>
            <input 
                type='checkbox' 
                check = ${overlay.display == 'visible'}
                @focus = ${() => {
                                    this.boundaryElemClasses[boundary.idx].focus = true;
                                    this.requestUpdate();
                                }} 
                @blur = ${() => {
                                    this.boundaryElemClasses[boundary.idx].focus = false;
                                    this.requestUpdate();
                                }}
                @click = ${(e) => this.onCheck(e.target, boundary, overlayId)}
                id=${overlayId}>
            </input>
        `})}`;
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
                        html`<li class="${classMap(this.boundaryElemClasses[boundary.idx])}" 
                                tabindex="1" 
                                @mouseenter=${(e) => {this.handleBoundaryFocus(boundary)}} 
                                @mouseexit=${(e) => {this.handleBoundaryBlur(boundary)}}>
                            <div class="boundary-title">${boundary.action}</div>
                            <div class="boundary-description">${boundary.description}</div>
                            <div class="boundary-contents">
                                ${boundary.overlays == undefined ? html`` : this.overlayList(boundary)}
                                <div class="overlay-root">
                                    ${this.defaultOverlays(boundary)}
                                </div>
                            </div>
                        </li>`)}
                </ul>
            </div>    
        </div>`;
    }
}

