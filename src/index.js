import { BoundarySidebar } from './boundary-sidebar';

customElements.define('boundary-sidebar', BoundarySidebar);
let sidebar = document.createElement('boundary-sidebar');
document.body.appendChild(sidebar);
var meta = [{'selector': {'type': 'link-query'}, 'type': 'on-load', 'action': {'type': 'disable'}, 'resource': 'all', 'overlays': [{'display': 'none', 'type': 'box'}], 'description': 'removed links to outside pages.'}, {'styles': {'pointer-events': 'none'}, 'selector': {'type': 'css-selector', 'query': 'div.showcase-photo-box\n'}, 'type': 'on-load', 'action': {'type': 'disable'}, 'resource': '/biz*', 'overlays': [{'display': 'visible', 'type': 'box'}, {'display': 'visible', 'type': 'tooltip'}], 'description': 'Disable links on photo boxes.'}];
document.addEventListener("DOMContentLoaded", () => {
    // var boundaries = new BoundaryList(meta);
    // boundaries.applyBoundaries();
    let sidebar = document.querySelector('boundary-sidebar');
    sidebar.boundaries = meta;
    // sidebar.populateBoundaryList();
});