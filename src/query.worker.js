function checkCdxQueryResult(uri) {
    return fetch(uri).then
    (res => res.text()).then
    (response => response != '');
}

onmessage = function(e) {
    console.log('received message');
    let href = e.data;
    console.log(href);
    checkCdxQueryResult(href).then((isPresent) => {
        console.log(isPresent);
        self.postMessage([href, isPresent]);
    })
};
