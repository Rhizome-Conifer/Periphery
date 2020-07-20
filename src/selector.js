import { Pool } from './worker-pool';

/*
    Queries backend CDX server to determine whether a given resource exists in the archive.
    link: A Node containing the href to check
*/
// function queryResource(href, worker) {
//     return new Promise((res) => {
//         if (!href.startsWith('javascript')) {
//             let url = host + "cdx?output=json&limit=1&url=" + encodeURIComponent(href);
//             worker.onmessage = (data) => {
//                 res(data);
//             }
//             worker.postMessage(url);
//         }    
//     })
// }

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
export function linkQuery(node) {
    if (node && node.nodeType === Node.ELEMENT_NODE) {
        let allHrefNodes = node.querySelectorAll('[href]');
        let allHrefsDedup = buildHrefListDedup(allHrefNodes);

        let pool = new Pool(4);
        let allLinkPromises = pool.processInput(allHrefsDedup);

        // // Query all deduped hrefs and correspond with their in-boundary status
        // allHrefsDedup.forEach(function(href,idx) {
        //     allLinkPromises.push(queryResource(href)
        //         .then((isPresent) => {
        //             return [href, isPresent];
        //         })
        //     );
        // }); 

        return allLinkPromises.then((nodes) => {
            console.log(nodes);
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