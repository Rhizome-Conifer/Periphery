class IntersectionElement {
    constructor(boundary, hrefs, presentCallback) {
        this.boundary = boundary;
        this.hrefs = hrefs;
        this.unobserveCallback = null;
    }

    intersectionCallback(entries, onQueryCallback) {
        let elem = entries[0];
        if (elem.intersectionRatio <= 0) return;
    
        let href = elem.target.href;
        if (this.hrefs[href] !== undefined) {
            if (this.hrefs[href] === false) {
                onQueryCallback(elem.target);
            }
        } else {
            queryResource(href).then((isPresent) => {
                this.hrefs[href] = isPresent;
                if (!isPresent) {
                    onQueryCallback(elem.target);
                }
            })
        }
        if (this.unobserveCallback !==null) {
            this.unobserveCallback(elem.target);
        } 
    }    
}

/*
    Uses an IntersectionObserver to perform link queries on elements only as they are loaded into view.
*/

export function linkQueryLazy(node, boundary, callback) {
    if (node && node.nodeType === Node.ELEMENT_NODE) {
        let allHrefNodes = node.querySelectorAll('[href]');
        let allLinkResults = {};


        console.log(allHrefNodes.length)
        allHrefNodes.forEach(function(node) {
            let intersectionElem = new IntersectionElement(boundary, allLinkResults, callback);
            let observer = new IntersectionObserver(intersectionElem.intersectionCallback.bind(intersectionElem));
            intersectionElem.unobserveCallback = () => {
                observer.disconnect();
            }
            observer.observe(node);
        })
    }
}


/*
    Determine whether a given backend CDX query returns a result.
*/
function checkCdxQueryResult(uri) {
    return fetch(uri).then
    (res => res.text()).then
    (response => response != '');
}

/*
    Queries backend CDX server to determine whether a given resource exists in the archive.
    link: A Node containing the href to check
*/
function queryResource(href) {
    if (!href.startsWith('javascript')) {
        let url = host + "cdx?output=json&limit=1&url=" + encodeURIComponent(href);
        return checkCdxQueryResult(url).then(isPresent => isPresent);
    } else {
        // for javascript() hrefs and other things that we know aren't within boundary
        return new Promise((resolve) => resolve(false));
    }
}

function buildHrefListDedup(nodes) {
    let allHref = [];
    let allHrefDedup = [];
    nodes.forEach(function(node) {
        let ref = node.href;
        allHref.push(ref);
        if (allHrefDedup.indexOf(ref) == -1) {
            allHrefDedup.push(ref);
        }
    });
    return allHrefDedup;
}

/*
    Selects all elements with href attribute and queries whether they point to an in-boundary resource
*/
export function linkQuery(node, _) {
    if (node && node.nodeType === Node.ELEMENT_NODE) {
        let allHrefNodes = node.querySelectorAll('[href]');
        let allHrefsDedup = buildHrefListDedup(allHrefNodes);
        let allLinkPromises = [];

        // Query all deduped hrefs and correspond with their in-boundary status
        allHrefsDedup.forEach(function(href) {
            allLinkPromises.push(queryResource(href)
                .then((isPresent) => {
                    return [href, isPresent];
                })
            );
        }); 

        return Promise.all(allLinkPromises).then((nodes) => {
            let allLinkResults = {};
            nodes.forEach(function (node) {
                allLinkResults[node[0]] = node[1];
            })

            let filteredNodes = [];
            allHrefNodes.forEach(function (node) {
                if (!allLinkResults[node.href]) {
                    filteredNodes.push(node);
                }
            })
            return filteredNodes;
        })
    }
}

export function cssSelector(node, boundary) {
    return new Promise((resolve) => {resolve(node.querySelectorAll(boundary.selector))});
}