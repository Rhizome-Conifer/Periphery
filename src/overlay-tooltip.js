import { html, css, LitElement } from 'lit-element';
import {styleMap} from 'lit-html/directives/class-map';

export class OverlayTooltip extends HTMLElement {
    static get styles() {
        return css`
        .overlay-tooltip {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            background: none;
            opacity: 1;
            pointer-events: auto;
      
            font-size: 12px;
            color: black;
            font-weight: normal;
            text-shadow: none;
            z-index: 10000;
          }
      
          .overlay-tooltip:hover::after {
            visibility: visible;
          }
      
          .overlay-tooltip::after {
            position: absolute;
            top: 100%;
            background-color: white;
            border: 1px solid black;
            box-sizing: border-box;
            margin: 5px 0;
            padding: 5px;
            visibility: hidden;
            left: 0;
            text-align: center;
            content: attr(data-after);
          }      
        `;
    }

    static get properties() {
        return {
            style: {attribute: false},
            description: {attribute: false},
        }
    }
    
    constructor() {
        super();
        this.style = {};
        this.description = '';
    }

    render() {
        return html`
            <div class="overlay-tooltip"
                style=${styleMap(this.style)}
                data-after=${this.description || ''}
            ></div>
        `
    }
}