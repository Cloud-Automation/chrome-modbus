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

            chrome.sockets.tcp.create({}, function (createInfo) {
            
                con.socketId = createInfo.socketId;
           
                    chrome.sockets.tcp.connect(
                        con.socketId,
                        con.host,
                        con.port,
                        function (result) {
                  
                            if (result !== 0) {
                        
                                defer.reject({ errCode: 'connectionError', result: result });
                                chrome.sockets.tcp.destroy(that.socketId);

                                return;

                            }
            
                            defer.resolve(new ModbusClient(con)); 
                    
                });

            });

            return defer.promise();

        },

        close: function (socketId) {
        
            chrome.sockets.tcp.close(socketId);
        
        }
    
    };

    CloudAutomation.ModbusClient = pModbusClient;

})();
