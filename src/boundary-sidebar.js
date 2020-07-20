import {LitElement, html, css} from 'lit-element';
import {classMap} from 'lit-html/directives/class-map';
import {styleMap} from 'lit-html/directives/style-map';

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
                font-size: 14px;
                line-height: 20px;
                list-style: none;
                background-color: #ffffff;
                border: 1px solid black;
                padding: 5px;
                margin: 10px;
                display: inline-block;
                position: relative;
                max-height: 50px;
                height: auto;
                transition: max-height 300ms ease-in-out;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
            }
        
            .boundary.focus {
                max-height: 500px;
            }
        
            .boundary:hover {
                border: 3px solid black;
                padding: 3px;
            }

            .boundary-contents {
                display: flex;
                flex-direction: column;
            }

            .boundary.focus > .boundary-description {
                overflow: visible;
                white-space: normal;
            }
        
            .boundary-description {
                margin: 0 0 10px;
                min-height: 20px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        
            .boundary-title {
                font-weight: bold;
            }
        
            .overlay-root {
                position: fixed;
                top: 0px;
                left: 0px;
            }

            .loading {
                pointer-events: none;
            }

            .loader-container {
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.7);
                top: 0;
                left: 0;
            }

            .loader,
            .loader::after {
                border-radius: 50%;
                width: 10px;
                height: 10px;
            }
            .loader {
                margin: 10px auto;
                font-size: 10px;
                position: relative;
                text-indent: -9999em;
                border-top: 5px solid rgba(0, 0, 0, 0.2);
                border-right: 5px solid rgba(0, 0, 0, 0.2);
                border-bottom: 5px solid rgba(0, 0, 0, 0.2);
                border-left: 5px solid #dddddd;
                -webkit-transform: translateZ(0);
                -ms-transform: translateZ(0);
                transform: translateZ(0);
                -webkit-animation: load8 1.1s infinite linear;
                animation: load8 1.1s infinite linear;
            }
            @-webkit-keyframes load8 {
            0% {
                -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
            }
            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
            }
            }
            @keyframes load8 {
            0% {
                -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
            }
            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
            }
            }
        `;
    }

    static get properties() {
        return {
            boundaries: {attribute: false},
            boundaryElemClasses: {attribute: false},
            boundaryDefaultOverlays: {attribute: false},
            boundariesApplied: {attribute: false},
            hidden: {attribute: true},
            postMessageOrigin: {attribute: 'post-message-origin'}
        }
    }

    set boundaries(value) {
        let oldVal = this._boundaries;
        this._boundaries = new BoundaryList(value);
        // Set up stylng for overlay divs and UI list element
        this._boundaries.boundaries.forEach((boundary) => {
            this.boundaryElemClasses[boundary.idx] = {"loading": true, "boundary": true}
            this.boundaryDefaultOverlays[boundary.idx] = false;
        })
        
        this.boundariesApplied = this._boundaries.applyBoundaries(function(boundary) {
            this.boundaryElemClasses[boundary.idx].loading = false;
            this.requestUpdate();
        }.bind(this));
        this.requestUpdate('boundaries', oldVal);
    }

    applyBoundaries(callback) {
        this.boundariesApplied = this._boundaries.applyBoundaries(callback);
    } 

    constructor() {
        super();
        this._boundaries = [];
        this._boundaryOverlays = {};
        this.boundaryElemClasses = {};
        this.boundaryDefaultOverlays = {};

        this.styles = {};
        this.hidden = false;
        this.postMessageOrigin = window.origin;

        window.addEventListener("message", this.handlePostMessage.bind(this), false);
    }    
    
    /*
        Handle postMessage events from outside the iframe (framed replay mode)
    */
    handlePostMessage(msg) {
        console.log(this.postMessageOrigin);
        if (msg.origin === this.postMessageOrigin) {
            let msgData = JSON.parse(msg.data);
            let oldVal = this.styles;
            if (msgData.type === 'hideSidebar') {
                this.hidden = true;
            }
            if (msgData.type === 'style') {
                this.styles = msgData.value;
            }
            this.requestUpdate('styles', oldVal);
        }
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
        let sidebarDiv = this.shadowRoot.querySelector('#boundary-sidebar');
        if (boundary.affectedNodes !== undefined && sidebarDiv != null) {
            let boundaryRect = sidebarDiv.getBoundingClientRect();
            return html`
                ${boundary.affectedNodes.map((node) => {
                    let rect = node.getBoundingClientRect();
                    let styles = {
                        width: rect.width + 'px',
                        height: rect.height + 'px',
                        top: (rect.y - boundaryRect.y) + 'px',
                        left: (rect.x - boundaryRect.x) + 'px',
                        visibility: this.boundaryDefaultOverlays[boundary.idx] ? 'visible' : 'hidden',
                        opacity: 1
                    };
                    return rect.width > 0 && rect.height > 0 ? html`
                        <boundary-overlay 
                            .styles=${styles}
                            className='overlay'
                        >
                        </boundary-overlay>
                    ` : html``;
                })}
            `
        }
    }

    /*
        Handle mouse enter / exit events for a given boundary sidebar element.
        @param boundary: the Boundary object corresponding to the element the event was fired on
        @param val: whether the boundary's overlays should be shown.
    */
    handleBoundaryMouse(boundary, val) {
        this.boundaryDefaultOverlays[boundary.idx] = val;
        this.requestUpdate();
    }

    /*
        Handler for focus / blur events for a given boundary sidebar element.
        @param boundary: the Boundary object corresponding to the element the event was fired on
        @param val: whether the 'focus' class should be applied to the boundary element.
    */
    handleBoundaryFocus(boundary, val) {
        this.boundaryElemClasses[boundary.idx].focus = val;
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
            <div class="overlay-container">
                <label 
                    for=${overlayId}>
                    ${overlay.type}
                </label>
                <input 
                    type='checkbox' 
                    checked = ${overlay.display == 'visible'}
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
            </div>
        `})}`;
    }

    /*
        Returns a style string based on this.styles, which can be set via postMessage 
    */
    getExternalStyle() {
        let styleString = '\n';
        Object.keys(this.styles).forEach(function (selector) {
            let style = this.styles[selector];
            let attributes = JSON.stringify(style).split(',').join(';\n');
            
            styleString += selector + ' ' + attributes.split('\"').join('');
        }.bind(this));
        return styleString;
    }

    render() {
        return html`
        <style>
            ${this.getExternalStyle()}
        </style>
        <div id="sidebar-container" style=${styleMap({'visibility': this.hidden ? 'hidden' : 'visible'})}>
            <input type="checkbox" id="sidebar-toggle">
            <label for="sidebar-toggle" class="sidebar-toggle-icon">
                <div class="sidebar-check">i</div>
            </label>
            <div id="boundary-sidebar">
                <ul id="boundary-list">
                    ${this._boundaries.boundaries === undefined ? html`` : this._boundaries.boundaries.map((boundary) => 
                        html`<li class="${classMap(this.boundaryElemClasses[boundary.idx])}" 
                                tabindex="1" 
                                @mouseenter=${(e) => {this.handleBoundaryMouse(boundary, true)}} 
                                @mouseleave=${(e) => {this.handleBoundaryMouse(boundary, false)}}
                                @focus=${(e) => this.handleBoundaryFocus(boundary, true)}
                                @blur=${(e) => this.handleBoundaryFocus(boundary, false)}
                                >
                            <div class="boundary-title">${boundary.action}</div>
                            <div class="boundary-description">${boundary.description}</div>
                            <div class="boundary-contents">
                                ${boundary.overlays == undefined ? html`` : this.overlayList(boundary)}
                                <div class="overlay-root">
                                    ${this.defaultOverlays(boundary)}
                                </div>
                            </div>
                            ${this.boundaryElemClasses[boundary.idx].loading ? html`
                                <div class="loader-container">
                                    <div class="loader">
                                        Loading...
                                    </div>
                                </div>
                            ` : html``}
                        </li>`)}
                </ul>
            </div>    
        </div>`;
    }
}

