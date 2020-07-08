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
function queryResource(link) {
    let node = link;
    let href = node.href;
    if (!href.startsWith('javascript')) {
        let url = host + "cdx?output=json&url=" + encodeURIComponent(href);
        return checkCdxQueryResult(url).then(isPresent => isPresent);
    } else {
        // for javascript() hrefs and other things that we know aren't within boundary
        return new Promise((resolve) => resolve(false));
    }
}

/*
    Selects all elements with href attribute and queries whether they point to an in-boundary resource
*/
export function linkQuery(node) {
    if (node && node.nodeType === Node.ELEMENT_NODE) {
        let allLinks = []
        node.querySelectorAll('[href]').forEach(function (elem) {
            // create structure containing links and whether they're within boundary
            allLinks.push(queryResource(elem)
            .then((isPresent) => {
                return [elem, isPresent]
            }))
        }.bind(this));

        return Promise.all(allLinks).then((nodes) => {
            return nodes.filter(nodeItem => !(nodeItem[1])).map(nodeItem => nodeItem[0]);
        })
    }
}

export function cssSelector(node, selector) {
    return new Promise((resolve) => {resolve(node.querySelectorAll(selector))});
}