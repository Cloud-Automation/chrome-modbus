var ModbusServerClient = function (clientSocketId, server) {

    if (!(this instanceof ModbusServerClient)) {
        return new ModbusServerClient(clientSocketId, server);
    }

    this._client_socket_id  = clientSocketId;
    this._server            = server;

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

        if (request.body.fc === 0x04) {
        
            ret_buffer = new ArrayBuffer(7 + 2 + request.body.cnt * 2);

            ret_body_dv = new DataView(ret_buffer, 7, 2 + request.body.cnt * 2);

            ret_body_dv.setUint8(0, 4);
            ret_body_dv.setUint8(1, request.body.cnt);

            for (var i = 0; i < request.body.cnt; i += 1) {
           
                console.log('ModbusServerClient', 'InputRegister with index', request.body.adr,'has value', this._server.getInputRegister(request.body.adr + i));

                ret_body_dv.setUint16(2 + (i * 2), this._server.getInputRegister(request.body.adr + i));

            }

        }

        if (request.body.fc === 0x06) {

            ret_buffer = new ArrayBuffer(12);

            ret_body_dv = new DataView(ret_buffer, 7, 5);

            console.log('ModbusServerClient', 'Writing Input Register');

            this._server.setInputRegister(request.body.adr, request.body.val);

            this._server.fire('writeInputRegister', [request.body.adr, request.body.val]);

            ret_body_dv.setUint8(0, 6); // fc
            ret_body_dv.setUint16(1, request.body.adr);
            ret_body_dv.setUint16(3, request.body.val);
        
        }

        ret_head_dv = new DataView(ret_buffer, 0, 7);

        ret_head_dv.setUint16(0, request.header.tid);
        ret_head_dv.setUint16(2, request.header.pid);
        ret_head_dv.setUint16(4, request.header.len);
        ret_head_dv.setUint8(6, request.header.uid);


        return ret_buffer;
    
    };
    

    this._send_answer = function (buffer) {
    
        var defer = $.Deferred();

        console.log('ModbusServerClient', 'Sending answer to the client.');

        chrome.sockets.tcp.send(this._client_socket_id, buffer, function (ret) {

            if (ret < 0 ) {
            
                console.error('ModbusServerClient', 'Sending an answer failed.');

                defer.reject();
                return;
            
            }

            console.log('ModbusServerClient', 'Sending answer succeeded.');
        
            defer.resolve();

        });

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

var ServerRegister = function (start, server) {

    if (!(this instanceof ServerRegister)) {
        return new ServerRegister(start, server);
    }

    Events.call(this);

    this._start     = start;
    this._server    = server;

    this._command   = {
    
        'count' :   0,
        'id'    :   0,
        'ex'    :   false

    };

    this._status    = {
    
        'stateflag_1'       : false,
        'stateflag_2'       : false,
        'stateflag_3'       : false,
        'stateflag_4'       : false,
        'stateword'         : 0,
        'command_counter'   : 0,
        'command_ex'        : false,
        'command_fail'      : false,
        'arg'               : 0

    };

    this._update_status = function () {
    
        var s = 0;

        s += this._status.stateflag_1?1:0;
        s += this._status.stateflag_2?2:0;
        s += this._status.stateflag_3?4:0;
        s += this._status.stateflag_4?8:0;
        s += this._status.stateword & 0xFF >> 4;
        s += this._status.command_count & 0x07 >> 11;
        s += this._status.command_ex?0x4000:0 >> 14;
        s += this._status.command_fail?0x8000:0 >> 15;

        this._server.setInputRegister(this._start + 1, this._status.arg);
        this._server.setInputRegister(this._start, s);

    
    };

    this._evaluate = function (val) {

        this._command.count = val & 0x0007 << 0;
        this._command.id    = val & 0x7FF8 << 3;
        this._command.ex    = val & 0x8000 << 15;

        // always succeed


        this._status.command_counter = this._command.count;
        this._status.command_ex = true;

        this._update_status();

    };

    this._server.on('writeSingleRegister', function (start, val) {
    
        if (start === this._start + 2) {
        
            this._evaluate(val);

        }

    });

};

ServerRegister.inherits(Events);


ModbusServer = function (host, port) {

    if (!(this instanceof ModbusServer)) {
        return new ModbusServer(host, port);
    }

    Events.call(this);

    this._host                  = host;
    this._port                  = port;

    this._socket_id             = null;
    this._is_connected          = false;

    this._clients               = [];

    this._input_register_offset = 0;

    this._input_register        = [];
    this._coils                 = []; 

    this._create_new_client = function (info) {

        console.log('ModbusServer', this);

        console.log('ModbusServer', 'New client created.');

        this._clients.push(new ModbusServerClient(info.clientSocketId, this));
   
    };
    

};

ModbusServer.inherits(Events);

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
       
            chrome.sockets.tcpServer.onAccept.addListener(
                that._create_new_client.bind(that));

            defer.resolve();
        
        });
    
    });

});

ModbusServer.method('stop', function () {

    console.log('ModbusServer', 'Server stopped.');

    chrome.sockets.tcpServer.close(this._socket_id, function () { });

});

ModbusServer.method('setInputRegisterOffset', function (offset) {

    this._input_register_offset = offset;

    return this;

});

ModbusServer.method('setInputRegister', function (adr, value) {

    this._input_register[this._input_register_offset + adr] = value;

    return this;

});

ModbusServer.method('getInputRegister', function (adr) {

    return this._input_register[this._input_register_offset + adr];

});

ModbusServer.method('createNewRegister', function (start) {

    return new ServerRegister(start, this);

});
