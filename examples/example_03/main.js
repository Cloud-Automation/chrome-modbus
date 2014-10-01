
$(document).ready(function () {

    var connectPage = new ConnectPage(),
        setupPage   = new SetupPage(),
        consolePage = new ConsolePage(),
        client      = new ModbusClient(),
        loop        = new ModbusLoop(client),
        ok_clicked_handler,
        reg;

    App.addPage(connectPage);
    App.addPage(setupPage);
    App.addPage(consolePage);

    connectPage.on('page_visible', function () {
    
        chrome.storage.local.get('last', function (data) {
       
            if (!data.last) {
            
                chrome.storage.local.set({ 'last': [] }, function () {
               
                    connectPage.setLast([]); 
                
                });
            
            } else {
            
                connectPage.setLast(data.last);
            
            }
        
        });
    
    });


    client.on('connected', function () {
 
        chrome.storage.local.get('last', function (data) {

            var isInside = false;

            for (var i in data.last) {
            
                if (data.last[i].host === client.host && 
                    data.last[i].port === client.port) {

                    isInside = true;               

                }
            
            }

            if (!isInside) {

                data.last.unshift({ 'host': client.host, 'port': client.port });

                if (data.last.length > 5) {
            
                    data.last.pop();

                }

            }

            chrome.storage.local.set( { 'last' : data.last }, function () {
 
                App.log('Connection established.');

                App.showPage(setupPage); 
            
            });
        
        });
   
    
    });

    client.on('disconnected', function () {
    
        App.log('Connection closed.');

        App.showPage(connectPage);

        connectPage.enable();

    });

    client.on('error', function (err) {
    
        App.log_error('Connection error (' + err.errCode + ')' );

        App.showPage(connectPage);

        connectPage.disable();
    
    });

    connectPage.on('connect_clicked', function () {
    
        client.connect(connectPage.getHost(), connectPage.getPort());
    
    });

    setupPage.on('disconnect_clicked', function () {
        
        client.disconnect();
                
    });

    setupPage.on('setup_clicked', function () {
   
        var offset = setupPage.getOffset();

        if (offset < 0) {

            App.log_error('Offset is not valid.');
            return;

        }

        App.log('Register setup was successfull.');

        App.showPage(consolePage);


        reg  = new Register(client, loop, offset);

        reg.on('update_status', function () {

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

        ok_clicked_handler = consolePage.on('ok_clicked', function () {
        
            var cmd = consolePage.getCommand(); 

            App.log('Executing command ' + cmd);

            reg._execute(cmd).then(function () {
       
                App.log('Command execution successfull.');
        
            }).fail(function (err) {
            
                App.log_error('Command execution failed (' + err.errCode + ')');
        
            });

        });

        loop.start();

    });

    consolePage.on('disconnect_clicked', function () {
        
        client.disconnect();

    });

    consolePage.on('back_clicked', function () {
  
        consolePage.off(ok_clicked_handler);

        reg.close();

        App.showPage(setupPage);
    
    });

    App.showPage(connectPage);

    App.log('Ready');

});
