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
  
 
        var start = false, wr = 0;

        var write = function () {
        
            client.writeSingleRegister(12288, wr++).then(function () {
            
                log('Writing Register done!');

            }).fail(function () {
            
                log('Writing Register failed.');
            
            });
        
        };

        var read = function () {
        
            client.readInputRegisters(12288, 1).then(function (reg) {
            
                log('Reading ' + reg[0] + ' from register.');
            
            }).fail(function (err) {
            
                log('Reading register failed (ErrCode : ' + err.errCode + ')');
            
            });
        
        };

        document.getElementById('write').addEventListener('click', write);
        document.getElementById('read').addEventListener('click', read);
                

    }).fail(function () {

        log('Connection failed.');

    });

})();
