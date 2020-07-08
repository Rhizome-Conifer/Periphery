import {Overlay} from './overlay';
import { customElement } from 'lit-element';

/*
    Applies an object with CSS style key-value pairs to a list of nodes.
    nodes: a NodeList or array containing the nodes to which to apply styling.
    styles: an object containing key-value pairs representing CSS attributes.
*/
export function applyStylesToNodes(nodes, styles) {
    nodes.forEach(function(node) {
        Object.keys(styles).forEach(function (key) {
            node.style[key] = styles[key];
        });
    })
}

/*
    Creates a custom boundary-overlay element and attaches it to the given DOM node.
    @param elem: the DOM node to attach to 
    @param className: the class to attach to the boundary element
    @param description: the description to attach to the element
*/
export function attachDivOverlay(elem, className, description, styling) {
    if (customElements.get('boundary-overlay') === undefined) {
        customElements.define('boundary-overlay', Overlay);
    }
    let overlay = document.createElement('boundary-overlay');
    overlay.className = className;
    overlay.description = description;
    overlay.styles = styling;
    elem.appendChild(overlay);
    return overlay;
}

/*
    Builds a valid CSS style based on an object containing CSS attribuets in key-value pairs, and adds it to the DOM in a <style> element.
*/
export function inlineStyle(node, style, selector) {
    let attributes = JSON.stringify(style).split(',').join(';');
    let styleString = selector + ' ' + attributes.split('\"').join('');

    let styleElem = document.createElement('style');
    styleElem.type = 'text/css';
    styleElem.appendChild(document.createTextNode(styleString));
    node.appendChild(styleElem);
};



