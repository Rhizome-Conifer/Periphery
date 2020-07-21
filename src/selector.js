
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
export function linkQuery(node, _, host, endpoint) {
    if (node && node.nodeType === Node.ELEMENT_NODE) {
        let allHrefNodes = node.querySelectorAll('[href]');
        let allHrefsDedup = buildHrefListDedup(allHrefNodes);
        let allLinkPromises = [];

        // Query all deduped hrefs and correspond with their in-boundary status
        allHrefsDedup.forEach(function(href) {
            allLinkPromises.push(queryResource(href, host, endpoint)
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

export function cssSelector(node, selector) {
    return new Promise((resolve) => {resolve(node.querySelectorAll(selector))});
}