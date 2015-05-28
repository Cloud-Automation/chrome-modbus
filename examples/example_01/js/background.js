chrome.app.runtime.onLaunched.addListener(function () {

    chrome.app.window.create('window.html', {
        'state' : 'fullscreen',
//        'bounds'    : {
            'width': 500,
            'height': 500
//        }
    });

});
