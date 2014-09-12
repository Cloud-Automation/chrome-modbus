(function () {

    if (!(window.CloudAutomation)) {
        window.CloudAutomation = {};
    }

    var pModbusClient = {
    
        connect: function () {
        
            var con     = { },
                defer   = $.Deferred(); 

            con.host    = arguments[0];
            con.port    = arguments.length === 2 ? arguments[1] : 502;

            console.log('Modbus', 'Creating Socket for', con.host, con.port);

            chrome.sockets.tcp.create({}, function (createInfo) {
           
                console.log('Modbus', 'Socket created with socketId', createInfo.socketId);

                con.socketId = createInfo.socketId;
           
                    chrome.sockets.tcp.connect(
                        con.socketId,
                        con.host,
                        con.port,
                        function (result) {
                  

                            if (result !== 0) {
 
                                console.log('Modbus', 'Connection not established. Error Code', result);
                       
                                defer.reject({ 
                                    errCode: 'connectionError', 
                                    result: result 
                                });

                                chrome.sockets.tcp.destroy(con.socketId);

                                return;

                            }

                            console.log('Modbus', 'Connection established.');
            
                            defer.resolve(new ModbusClient(con)); 
                    
                });

            });

            return defer.promise();

        },

        close: function (socketId) {
       
            console.log('Modbus', 'Closing socket with socketId', socketId);

            chrome.sockets.tcp.close(socketId);
        
        }
    
    };

    CloudAutomation.ModbusClient = pModbusClient;

})();
