export class OverlayTooltip extends HTMLElement {
    static get observedAttributes() {
        return ['style', 'data-after']
    }
    
    constructor() {
        super();
        let shadowRoot = this.attachShadow({mode: 'open'});
        let tmpl = document.getElementById('overlay-tooltip-template'); 
        shadowRoot.appendChild(tmpl.content.cloneNode(true));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        let elem = this.shadowRoot.querySelector('.overlay-tooltip');
        if (name == 'data-after') {
            elem.setAttribute(name, newValue);
        } else if (name == 'style') {
            if (newValue.indexOf('opacity') !== -1) {
                elem.style.opacity = newValue.slice(-2);
            }
        }
    }
}