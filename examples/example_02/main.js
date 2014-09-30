(function () {

    var con = document.getElementById('log');

    var log = function (text) {
    
        var e = document.createElement('span'),
            br = document.createElement('br');

        e.innerHTML = text;

        con.appendChild(e);
        con.appendChild(br);
    
    };

    var client  = new ModbusClient(),
        wr      = 0;


    var write = function () {
    
        var offset  = parseInt($('#offset').val());

        log('Writing ' + wr + ' to ' + offset);

        client.writeSingleRegister(offset, wr++).then(function () {
        
            log('Writing Register done!');

        }).fail(function () {
        
            log('Writing Register failed.');
        
        });
    
    };

    var read = function () {
    
        var offset  = parseInt($('#offset').val());

        log('Reading one register from ' + offset);

        client.readInputRegisters(offset, 1).then(function (reg) {
        
            log('Reading ' + reg[0] + ' from register.');
        
        }).fail(function (err) {
        
            log('Reading register failed (ErrCode : ' + err.errCode + ')');
        
        });
    
    };

    document.getElementById('write').addEventListener('click', write);
    document.getElementById('read').addEventListener('click', read);


    log('Start connection...');

    $('#console').hide();


    client.on('connected', function () {
    
        log('Connection established.');  

        $('#connect').hide();
        $('#console').show();
  
    });

    client.on('disconnected', function () {
  
        log('Connection closed.');

        $('#connect').show();
        $('#disconnect').hide(); 

    });

    client.on('error', function () {

        log('Connection error.');

        setTimeout(function () {
        
            client.reconnect();

        }, 5000);

    });

    $('#connect_button').on('click', function () {

        var host    = $('#host').val(),
            port    = parseInt($('#port').val());

        client.connect(host, port);

    });

})();
