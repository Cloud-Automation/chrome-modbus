var ModbusServerClient = function (info, server, simDelay) {

    if (!(this instanceof ModbusServerClient)) {
        return new ModbusServerClient(info, server, simDelay);
    }

    this._info              = info;
    this._client_socket_id  = info.clientSocketId;
    this._server            = server;
    this._simDelay          = simDelay || 0;

    this._queue             = [];

    this._get_requests = function (data) {
    
        var ret = [],
            offset = 0,
            header, body, request;

        console.log('ModbusServerClient', 'Processing request with length', data.byteLength);

        while (offset < data.byteLength) {
      
            console.log('ModbusServerClient', 'Getting request at message offset', offset);

            header = new DataView(data, offset, 7);

            request = {
                header: {
                    'tid': header.getUint16(0),
                    'pid': header.getUint16(2),
                    'len': header.getUint16(4),
                    'uid': header.getUint8(6)
                }
            };

            console.log('ModbusServerClient', 'Request header', request.header);

            offset += 7;

            body = new DataView(data, offset, request.header.len - 1);

            request.body = {
                'fc': body.getUint8(0)
            };

            console.log('ModbusServerClient', 'Function Code of request is', request.body.fc);

            if (request.body.fc === 0x03) {
                request.body.adr = body.getUint16(1);
                request.body.cnt = body.getUint16(3);
            } 
            
            if (request.body.fc === 0x04) {
            
                request.body.adr = body.getUint16(1);
                request.body.cnt = body.getUint16(3);
            
            }

            if (request.body.fc === 0x06) {
            
                request.body.adr = body.getUint16(1);
                request.body.val = body.getUint16(3);
            
            }

            console.log('ModbusServerClient', 'Rest of the body looks like this', request.body);

            offset += request.header.len - 1;

            ret.push(request);
        
        }
   
        return ret;

    };

    this._handle_request = function (request) {
        
        console.log('ModbusServerClient', 'Handling request.');

        var ret_buffer, ret_head_dv, ret_body_dv;

        if (request.body.fc === 0x03) {
       
            console.log('ModbusServerClient', 'Preparing response for fc 0x03');

            ret_buffer = new ArrayBuffer(7 + 2 + request.body.cnt * 2);

            // MBAP
            ret_head_dv = new DataView(ret_buffer, 0, 7);

            ret_head_dv.setUint16(0, request.header.tid);
            ret_head_dv.setUint16(2, request.header.pid);
            ret_head_dv.setUint16(4,  1 + 2 + request.body.cnt * 2);
            ret_head_dv.setUint8(6, request.header.uid);

            // BODY
            ret_body_dv = new DataView(ret_buffer, 7, 2 + request.body.cnt * 2);

            console.log('ModbusServerClient', 'Request body count', request.body.cnt);

            ret_body_dv.setUint8(0, 3);
            ret_body_dv.setUint8(1, request.body.cnt * 2);

            for (var i = 0; i < request.body.cnt; i += 1) {
           
                console.log('ModbusServerClient', 'HoldingRegister with index', 
                            request.body.adr + i,
                            'has value', 
                            this._server.getHoldingRegister(request.body.adr + i));

                ret_body_dv.setUint16(
                    2 + (i * 2), 
                    this._server.getHoldingRegister(request.body.adr + i));

            }

            this._server.fire('read_holding_registers', 
                              [ request.body.adr, request.body.cnt ]);

        }


        if (request.body.fc === 0x04) {
       
            console.log('ModbusServerClient', 'Preparing response for fc 0x04');

            ret_buffer = new ArrayBuffer(7 + 2 + request.body.cnt * 2);

            // MBAP
            ret_head_dv = new DataView(ret_buffer, 0, 7);

            ret_head_dv.setUint16(0, request.header.tid);
            ret_head_dv.setUint16(2, request.header.pid);
            ret_head_dv.setUint16(4,  1 + 2 + request.body.cnt * 2);
            ret_head_dv.setUint8(6, request.header.uid);

            // BODY
            ret_body_dv = new DataView(ret_buffer, 7, 2 + request.body.cnt * 2);

            console.log('ModbusServerClient', 'Request body count', request.body.cnt);

            ret_body_dv.setUint8(0, 4);
            ret_body_dv.setUint8(1, request.body.cnt * 2);

            for (var i = 0; i < request.body.cnt; i += 1) {
           
                console.log('ModbusServerClient', 'InputRegister with index', 
                            request.body.adr + i,
                            'has value', 
                            this._server.getInputRegister(request.body.adr + i));

                ret_body_dv.setUint16(
                    2 + (i * 2), 
                    this._server.getInputRegister(request.body.adr + i));

            }

            this._server.fire('read_input_registers', 
                              [ request.body.adr, request.body.cnt ]);

        }

        if (request.body.fc === 0x06) {

            ret_buffer = new ArrayBuffer(12);

            // MBAP
            ret_head_dv = new DataView(ret_buffer, 0, 7);

            ret_head_dv.setUint16(0, request.header.tid);
            ret_head_dv.setUint16(2, request.header.pid);
            ret_head_dv.setUint16(4, request.header.len);
            ret_head_dv.setUint8(6, request.header.uid);


            ret_body_dv = new DataView(ret_buffer, 7, 5);

            console.log('ModbusServerClient', 'Writing Holding Register');

            this._server.setHoldingRegister(request.body.adr, request.body.val);

            this._server.fire('write_single_register', [request.body.adr, request.body.val]);

            ret_body_dv.setUint8(0, 6); // fc
            ret_body_dv.setUint16(1, request.body.adr);
            ret_body_dv.setUint16(3, request.body.val);
        
        }




        return ret_buffer;
    
    };
    

    this._send_answer = function (buffer) {
    
        var defer = $.Deferred();

        console.log('ModbusServerClient', 'Sending answer to the client.');

        if (!this._simDelay) {

            console.log('ModbusServerClient', 'Sending answer right away, no SimMode.');

            chrome.sockets.tcp.send(this._client_socket_id, buffer, function (ret) {

                if (ret < 0 ) {
            
                    console.error('ModbusServerClient', 'Sending an answer failed.');

                    defer.reject();
                    return;
            
                }

                console.log('ModbusServerClient', 'Sending answer succeeded.');
        
                defer.resolve();

            });

        } else {
       
            console.log('ModbusServerClient', 'Holding back answer for', this._simDelay, 'ms (SimMode)');

            var that = this;

            setTimeout(function () {
                chrome.sockets.tcp.send(that._client_socket_id, buffer, function (ret) {
                
                    if (ret < 0) {
                    
                        console.error('ModbusServerClient', 'Sending an answer failed.');
                        defer.reject();
                        return;

                    }

                    console.log('ModbusServerClient', 'Sending answer succeeded.');

                    defer.resolve();
                
                });
            }, this._simDelay);
        
        }

        return defer.promise();
    
    };

    this._handle_message = function (info) {
   
        console.log('ModbusServerClient', 'Receiving new data.'); 

        var requests    = this._get_requests(info.data),
            send_q      = [],
            ret         = null;

        console.log('ModbusServerClient', 'Current data package contains', requests.length,' request');

        for (var i = 0; i < requests.length; i+=1) {

            ret = this._handle_request(requests[i]);

            send_q.push(this._send_answer(ret));

        }

        $.when(send_q).then(function () {
        
            console.log('ModbusServerClient', 'All requests handled.');

        }).fail(function () {
        
            console.log('ModbusServerClient', 'Handling requests failed.');

        });
    };

    var that = this;

    chrome.sockets.tcp.setPaused(this._client_socket_id, false, function () {
    
        console.log('ModbusServerClient', 'Client socket', 
                    that._client_socket_id, 'unpaused.');
    
    });

    chrome.sockets.tcp.onReceive.addListener(this._handle_message.bind(this));

};

ModbusServerClient.method('getInfo', function () {

    return this._client;

});

ModbusServerClient.method('close', function () {

    chrome.sockets.tcp.disconnect(this._client_socket_id, function () {
    
    });

});

ServerRegister = function (start, server) {

    if (!(this instanceof ServerRegister)) {
        return new ServerRegister(start, server);
    }

    Events.call(this);

    this._start     = start;
    this._server    = server;

    console.log('ServerRegister', 'Initialized with', this._start);

    this._command   = {
    
        'count' :   0,
        'id'    :   0,
        'ex'    :   false

    };

    this._status    = {
    
        'stateflag_1'       : 0,
        'stateflag_2'       : 0,
        'stateflag_3'       : 0,
        'stateflag_4'       : 0,
        'stateword'         : 0,
        'command_counter'   : 0,
        'command_ex'        : 0,
        'command_fail'      : 0,
        'arg'               : 0

    };

    this._update_status = function () {
    
        var s = 0;

        s += this._status.stateflag_1?1:0;
        s += this._status.stateflag_2?2:0;
        s += this._status.stateflag_3?4:0;
        s += this._status.stateflag_4?8:0;
        s += this._status.stateword << 4;
        s += this._status.command_counter << 11;
        s += this._status.command_ex << 14;
        s += this._status.command_fail << 15;

        this._server.setHoldingRegister(this._start, s);
        this._server.setHoldingRegister(this._start + 1, this._status.arg);

        console.log('ServerRegister', 'Updated Server Register', s, s.toString(16), s.toString(2));
    
    };

    this._evaluate = function (val) {

        this._command.count = (val & 0x0007) >> 0;
        this._command.id    = (val & 0x7FF8) >> 3;
        this._command.ex    = (val & 0x8000) >> 15;

        if (!this._command.ex) {
            console.log('ServerRegister', 'No execution flag.');
            return;
        }

        // fire new command event

        console.log('ServerRegister', 'Firing event', 'execute_' + this._command.id, this);

        this.fire('execute_' + this._command.id);


        // always succeed

        console.log("ServerRegister", 'New command', this._command);

        this._status.command_counter = this._command.count;
        this._status.command_ex = 1;

        console.log('ServerRegister', 'Updated status', this._status);

        this._update_status();

    };

    this._server.on('write_single_register', function (start, val) {
  
        console.log('ServerRegister', 'WriteSingleRegister executed.');

        if (start !== this._start + 2) {
            console.log('ServerRegister', 'Not this command register.', start, this._start + 2);
            return;
        }

        console.log('ServerRegister', 'Update on this command register.');
        
        this._evaluate(val);

    }.bind(this));

};

ServerRegister.inherits(Events);


ModbusServer = function (host, port, simDelay) {

    if (!(this instanceof ModbusServer)) {
        return new ModbusServer(host, port, simDelay);
    }

    StateMachine.call(this, 'offline');

    this._host                  = host;
    this._port                  = port;
    this._simDelay              = simDelay;

    this._socket_id             = null;

    this._clients               = [];

    this._input_register        = [];
    this._holding_register      = [];
    this._coils                 = []; 

    this.on('state_changed', function (oldState, newState) {
    
        if (newState !== 'offline') {
            return;
        }

        for (var i in this._clients) {
            this._clients[i].close();
        }
    
    });

    this._create_new_client = function (info) {

        console.log('ModbusServer', this);

        console.log('ModbusServer', 'New client created.');

        var new_client = new ModbusServerClient(info, this, this._simDelay);

        this.fire('client_accepted', [new_client]);

        this._clients.push(new_client);
   
    };
    

};

ModbusServer.inherits(StateMachine);

ModbusServer.method('getClients', function () {

    return this._clients;

});

ModbusServer.method('start', function () {

    var defer   = $.Deferred(),
        that    = this;

    console.log('ModbusServer', 'Start called.');

    chrome.sockets.tcpServer.create(function (createInfo) {
    
        that._socket_id = createInfo.socketId;

        console.log('ModbusServer', 'Socket created.', that._socket_id);

        console.log('ModbusServer', 'Listening on socket', that._socket_id, 'and host', that._host, ':', that._port);

        chrome.sockets.tcpServer.listen(that._socket_id, that._host, that._port, function (res) {
        
            if (res < 0) {
            
                console.error('ModbusServer', 'Listening to', that._host, that._port, 'failed', res);
                defer.reject({ errCode: 'notListening', result: res });
                chrome.sockets.tcpServer.close(that._socket_id, function () { });
                return;
            
            }

            console.log('ModbusServer', 'Server is listening on',
                        that._host, that._port);
      
            that.setState('online');

            chrome.sockets.tcpServer.onAccept.addListener(
                that._create_new_client.bind(that));

            defer.resolve();
        
        });
    
    });

});

ModbusServer.method('stop', function () {

    console.log('ModbusServer', 'Server stopped.');

    this.setState('offline');

    chrome.sockets.tcpServer.close(this._socket_id, function () { });

});

ModbusServer.method('setInputRegister', function (adr, value) {

    this._input_register[adr] = value;

    return this;

});

ModbusServer.method('getInputRegister', function (adr) {

    if (!this._input_register[adr]) {
        this._input_register[adr] = 0;
    }

    return this._input_register[adr];

});

ModbusServer.method('setHoldingRegister', function (adr, value) {

    this._holding_register[adr] = value;

    return this;

});

ModbusServer.method('getHoldingRegister', function (adr) {

    if (!this._holding_register[adr]) {
        this._holding_register[adr] = 0;
    }

    return this._holding_register[adr];

});



ModbusServer.method('createNewRegister', function (start) {

    return new ServerRegister(start, this);

});

ModbusServer.method('createCustomRegister', function (cls, start) {

    return new cls(start, this);

});
