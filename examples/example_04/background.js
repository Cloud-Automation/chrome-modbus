
var server = new ModbusServer('127.0.0.1', 8001);

server.start();

/* Missing something like this

chrome.app.runtime.onStopped.addListener(function () {

    chrome.sockets.tcpServer.close(socketId);

}); */
