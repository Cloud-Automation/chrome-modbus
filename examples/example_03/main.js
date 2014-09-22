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


    $('#console').hide();

    $('#connect_button').on('click', function () {

        var host    = $('#host').val(),
            port    = $('#port').val(),
            offset  = parseInt($('#offset').val());

        Modbus.connect(host, parseInt(port))
            .then(function (client) { 

                log('Connection established.');
         
                $('#connect').hide();
                $('#console').show(); 

                var loop    = new ModbusLoop(client),
                    reg     = loop.createRegister(Register, offset);


                reg.on('update_status', function (data) {
                
                    $('#s1').html(reg.status.stateflag_1?'1':'0');
                    $('#s2').html(reg.status.stateflag_2?'1':'0');
                    $('#s3').html(reg.status.stateflag_3?'1':'0');
                    $('#s4').html(reg.status.stateflag_4?'1':'0');
            
                    $('#state').html(reg.status.state);
                    $('#cid').html(reg.status.cmd_count);
                    $('#cex').html(reg.status.cmd_ex?'1':'0');
                    $('#cer').html(reg.status.cmd_err?'1':'0');

                    $('#s_arg').html(reg.status.arg);
                });

                loop.start();

                var execute_command = function () {
                
                    var cmd = document.getElementById('c_cmd').value;
              
                    log('Executing command ', cmd);

                    reg._execute(cmd).then(function () {
                   
                        log('Command execution successfull.');
                    
                    }).fail(function () {
                    
                        log('Command execution failed.');
                    
                    });

                };

                document.getElementById('c_ex').addEventListener('click', execute_command);
                        

            }).fail(function () {

                log('Connection failed.');

            });

        });

})();
