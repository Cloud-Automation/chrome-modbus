(function () {

    var con = document.getElementById('log');

    var log = function (text) {
    
        var e = document.createElement('span'),
            br = document.createElement('br');

        e.innerHTML = text;

        con.appendChild(e);
        con.appendChild(br);
    
    };


    log('Start connection...');

    var client  = new ModbusClient();

    console.log(client);

    var loop    = new ModbusLoop(client, 500),
        id1     = loop.readInputRegisters(12288, 2),
        id2     = loop.readInputRegisters(12290, 2);

    loop.on(id1, function (data) {

        document.getElementById('reg1').innerHTML = data[0];
        document.getElementById('reg2').innerHTML = data[1];

    });

    loop.on(id2, function (data) {
    
        document.getElementById('reg3').innerHTML = data[0];
        document.getElementById('reg4').innerHTML = data[1];
    
    });

    client.on('connected', function () {
    
        log('Client connected.');

        loop.start();        
    
    });

    client.on('disconnected', function () {
    
        log('Client disconnected.');

    });

    client.on('error', function () {
    
        log('Client error');

        console.log('Main', 'Client Error.', arguments);

        setTimeout(function () {
            
            client.reconnect();
            
        }, 5000);
    
    });

    var start = false;

    document.getElementById('start').addEventListener('click', function () {
        
        if (!start) {

            log('start clicked');
            client.connect('127.0.0.1', 8001);

            document.getElementById('start').innerHTML = 'stop';

            start = true;
            return;

        }

        log('stop clicked');
        document.getElementById('start').innerHTML = 'start';
        start = false;
        client.disconnect();

    });



})();
