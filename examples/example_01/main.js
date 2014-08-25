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

CloudAutomation.ModbusClient.connect('192.168.1.1')
    .then(function (client) { 

        log('Connection established.');
  
        log('Setting up poll.');

        poll = ModbusPoll(client, 70);

        log('Poll set up!');

        var id_1 = poll.readInputRegisters(12288, 2),
            id_2 = poll.readInputRegisters(12290, 2),
            e;

        poll.on(id_1, function (data) {

            document.getElementById('reg1').innerHTML = data[0];
            document.getElementById('reg2').innerHTML = data[1];

        });

        poll.on(id_2, function (data) {
        
            document.getElementById('reg3').innerHTML = data[0];
            document.getElementById('reg4').innerHTML = data[1];
       
        });

        poll.on('error', function (err) {

            log(err.errCode);

            log('Loop stopped.');

            start = false;
        
        });

        var start = false;

        document.getElementById('start').addEventListener('click', function () {
            
            if (!start) {

                log('start clicked');
                poll.start();
                start = true;
                return;

            }

            log('stop clicked');
            start = false;
            poll.stop();
                
        });


    }).fail(function () {

        log('Connection failed.');

    });

})();
