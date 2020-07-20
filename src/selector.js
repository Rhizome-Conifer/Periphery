function getIntersectionCallback(callback, unobserveCallback) {
    return function(entries) {
        let elem = entries[0];
        // If there is no intersection, do nothing
        if (elem.intersectionRatio > 0) {
            callback(elem.target);
            unobserveCallback(elem.target);
        }
    }
}

function getLinkQueryCallback(queryResults, otherCallback) {
    return function(elem) {
        if (elem.href !== undefined) {
            let href = elem.href;
            if (queryResults[href] !== undefined) {
                if (queryResults[href] === false) {
                    otherCallback(elem);
                }
            } else {
                queryResource(href).then((isPresent) => {
                    queryResults[href] = isPresent;
                    if (!isPresent) {
                        otherCallback(elem);
                    }
                })
            }
        }
    }
}

/*
    Uses an IntersectionObserver to perform link queries on elements only as they are loaded into view.
    @param boundary: the Boundary being applied
    @param node: the root HTML element from which to query
    @param callback: the function to be called with intersected elements to be passed into
*/
export function linkQueryLazy(boundary, node, callback) {
    if (node && node.nodeType === Node.ELEMENT_NODE) {
        let allHrefNodes = node.querySelectorAll('[href]');
        let allLinkResults = {};
        let queryCallback = getLinkQueryCallback(allLinkResults, callback);

        allHrefNodes.forEach(function(node) {
            let observer;
            let unobserveCallback = () => {
                observer.disconnect();
            }
            observer = new IntersectionObserver(getIntersectionCallback(queryCallback, unobserveCallback));
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
function queryResource(href, host, endpoint) {
    if (!href.startsWith('javascript')) {
        let url = host + endpoint + "?output=json&limit=1&url=" + encodeURIComponent(href);
        return checkCdxQueryResult(url);
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
export function linkQuery(node, boundary) {
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