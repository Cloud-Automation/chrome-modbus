// constants

var MBAP_TID                = 0,
    MBAP_PID                = 2,
    MBAP_LEN                = 4,
    MBAP_UID                = 6,
    BODY_FC                 = 0,
    BODY_START              = 1,
    BODY_COUNT              = 3,
    READ_COILS              = 1,
    READ_INPUT_REGISTERS    = 4,
    WRITE_SINGLE_COIL       = 5,
    WRITE_SINGLE_REGISTER   = 6;



ModbusClient = function (timeout) { 
   
    if (!(this instanceof ModbusClient)) {
        return new ModbusClient(timeout);
    }

    // needed for the inheritance
    StateMachine.call(this, 'init');

    this.host       = 'localhost';
    this.port       = 502;
    this.timeout    = timeout||5000;

    this.id         = 0;
    this.handler    = { };
    this._pQueue    = [];

    var that        = this;


    // flush everything when going from error to online again
    this.on('state_changed', function (oldState, newState) {
    
        if (oldState === 'error' && newState === 'online') {
            this._sendPacket();
        }

    });

    this._receiveListener = function (resp) { 

        var offset  = 0,
            hasMore = true,
            data    = resp.data;

        while (hasMore) {

            // read the header
            var mbap    = new DataView(data, offset + 0, 7),
                tid     = mbap.getUint16(0),
                pid     = mbap.getUint16(2),
                len     = mbap.getUint16(4),
                uid     = mbap.getUint8(6),
                res     = { };

            res.header = {
                transaction_id  : tid,
                protocol_id     : pid,
                length          : len,
                unit_id         : uid
            };

            // read the pdu
        
            var pdu = new DataView(data, offset + 7, 2);

            res.pdu = {
                fc          : pdu.getUint8(0),
                byte_count  : pdu.getUint8(1)
            };

            if (!that.handler[tid]) {

                // if there is no handler just skip this package

                offset += 9 + res.pdu.byte_count;

                hasMore = offset < data.byteLength;

                continue;
               
            }

            // cleartimeout
           
            clearTimeout(that.handler[tid].timeout); 

            // handle fc response
       
            var rHandler;

            if (res.pdu.fc > 0x80) {
           
                that.handler[tid].callback.reject();

                offset += 9 + res.pdu.byte_count;
                hasMore = offset < data.byteLength;

                continue;
            
            }

            rHandler = that._responseHandler[res.pdu.fc];


            if (!rHandler) {

                var error = {
                    'errCode'   : 'noResponseHandler',
                    'fc'        : res.pdu.fc
                };

                that.fire('error', [ error ]);
                that.handler[tid].callback.reject(error);

                offset += 9 + res.pdu.byte_count;

                hasMore = offset < data.byteLength;

                continue;

            } 
      
            var uHandler = that.handler[tid];

            // send resolve to the handler

            res.pdu.data = rHandler(res, offset, data, uHandler.requestPacket); 

            // handle data by function code

            if (res.pdu.data) {

                uHandler.callback.resolve(res.pdu.data, res);

            } else {

                uHandler.callback.resolve(res);

            }
               
            // delete the handler

            delete that.handler[tid];

            offset += 7 + 2 + res.pdu.byte_count;

            hasMore = offset < data.byteLength;
        
        }

    };

    this._responseHandler = { };

    this._responseHandler[1] = function (response, offset, data, request) {
        
        var dv = new DataView(data, offset + 9, response.pdu.byte_count),
            fc_data = [], i, t, j, mask,
            dvReq = new DataView(request, 0, request.byteLength),
            count = dvReq.getUint16(10);
            

        for (i = 0; i < response.pdu.byte_count; i += 1) {
        
            t = dv.getUint8(i);

            for (j = 0; j < 7; j += 1) {
            
                mask = 1 << j;

                fc_data.push(t & mask !== 0);

                count -= 1;

                if (count === 0) {
                    break;
                }

            }

        }

       return fc_data; 

    };

    this._responseHandler[4] = function (response, offset, data) {

        var dv = new DataView(data, offset + 7 + 2, response.pdu.byte_count),
            fc_data = [];

        for (var i = 0; i < response.pdu.byte_count / 2; i += 1) {
        
            fc_data.push(dv.getUint16(i * 2));
        
        }

        return fc_data;
    
    };

    this._responseHandler[5] = function (response, offset, data) {
    
/*            var dv = new DataView(data, offset + 9, response.pdu.byte_count),
            fc_data = []; */

        return null;
    
    };

    this._responseHandler[6] = function (response, offset, data) {
   
/*            var dv = new DataView(data, offset + 9, response.pdu.byte_count),
            fc_data = []; */

        return null;
    
    };

    this._createMBAP = function (packet, id) {
    
        var dv = new DataView (packet, 0, 7);

        dv.setUint16(MBAP_TID, id);    // Transaction ID
        dv.setUint16(MBAP_PID, 0);     // Modbus Protocol ID
        dv.setUint16(MBAP_LEN, 6);     //
        dv.setUint8(MBAP_UID, 255);    // Unit Identifier

    };

    this._createNewId = function () {

        this.id = (this.id + 1) % 10000;
    
    };

    this._sendPacket = function (packet) {
        
        if (arguments.length > 0) {
            this._pQueue.push(packet);
        }

        if (this._isWaiting || !this.inState('online')) {
            return;
        }

        if (this._pQueue.length === 0) {
            return;
        }

        this._isWaiting = true;

        var that    = this,
            packet  = this._pQueue.shift();

        chrome.sockets.tcp.send(

            this.socketId, packet, function (sendInfo) {
   
            if (sendInfo.resultCode < 0) {
            
                console.log('ModbusClient', 'A error occured while sending packet.', sendInfo.resultCode);

                that.setState('error');
                that._isWaiting = false;

                return;

            }

            that._isWaiting = false;

            that._sendPacket();
        
        });

    };

    this._setCallbackHandler = function (handler, packet, id) {

        var that = this;

        this.handler[id] = {
            'callback'      : handler,
            'requestPacket' : packet
        };

        this.handler[id].timeout = setTimeout(function () {

            if (that.inState('error')) {
                handler.reject({ errCode: 'error' });
                return;
            }

            that.setState('error');
            handler.reject({ errCode: 'timeout' });
            that.fire('error', [ { errCode: 'timeout' }]);

        }, this.timeout);

    };

    this._readCoils = function (regNo, regCount) {
    
        var defer = $.Deferred();

        if (!this.inState('online')) {
            defer.reject();
            return defer.promise();
        }

        var packet  = new ArrayBuffer(12),      // determine the length in byte
            body    = new DataView(packet, 7, 5);

        var id = this.id;

        this._createMBAP(packet, id);

        body.setUint8(BODY_FC, READ_COILS);     // Function Code Read Coils = 1
        body.setUint16(BODY_START, regNo);      // Start Register
        body.setUint16(BODY_COUNT, regCount);   // Register Count

        var data = new DataView(packet, 0, 12);

        this._setCallbackHandler(defer, packet, id);

        this._createNewId();

        this._sendPacket(packet);

        return defer.promise();
    
    };

    this._readInputRegisters = function (regNo, regCount) {
   
        var defer = $.Deferred();

        if (!this.inState('online')) {
            defer.reject();
            return defer.promise();
        }

        var packet  = new ArrayBuffer(12),        
            body    = new DataView(packet, 7, 5),
            id      = this.id;

        this._createMBAP(packet, id);

        body.setUint8(BODY_FC, READ_INPUT_REGISTERS);
        body.setUint16(BODY_START, regNo);
        body.setUint16(BODY_COUNT, regCount);

        this._setCallbackHandler(defer, packet, id);

        this._createNewId();

        this._sendPacket(packet);

        return defer.promise();

    };

    this._writeSingleCoil = function (addr, value) {
    
        var defer = $.Deferred();

        if (!this.inState('online')) {
            defer.reject();
            return defer.promise();
        }

        var packet  = new ArrayBuffer(12),
            body    = new DataView(packet, 7, 5),
            id      = this.id;

        this._createMBAP(packet, id);

        body.setUint8(BODY_FC, WRITE_SINGLE_COIL);
        body.setUint16(BODY_START, addr);
        body.setUint16(BODY_COUNT, value?65280:0);
    
        this._setCallbackHandler(defer, packet, id);

        this._createNewId();

        this._sendPacket(packet);

        return defer.promise();

    };

    this._writeSingleRegister = function (regNo, value) {
    
        var defer = $.Deferred();

        if (!this.inState('online')) {
            defer.reject();
            return defer.promise();
        }

        var packet  = new ArrayBuffer(12),
            body    = new DataView(packet, 7, 5),
            id      = this.id;

        this._createMBAP(packet, id);

        body.setUint8(BODY_FC, WRITE_SINGLE_REGISTER);
        body.setUint16(BODY_START, regNo);
        body.setUint16(BODY_COUNT, value);

        this._setCallbackHandler(defer, packet, id);

        this._createNewId();

        this._sendPacket(packet);

        return defer.promise();

    };

    chrome.sockets.tcp.onReceive.addListener(this._receiveListener);

};


ModbusClient.inherits(StateMachine);


ModbusClient.method('readCoils', function (regNo, regCount) {

    return this._readCoils(regNo, regCount);

});

ModbusClient.method('readInputRegisters', function (regNo, regCount) {

    return this._readInputRegisters(regNo, regCount);

});

ModbusClient.method('writeSingleCoil', function (regNo, value) {
            
    return this._writeSingleCoil(regNo, value);
});

ModbusClient.method('writeSingleRegister', function (regNo, value) {

    return this._writeSingleRegister(regNo, value);

});

ModbusClient.method('connect', function (host, port) {

    this.host = host;
    this.port = port;

    var that = this;


    var connect = function () { 
    
        console.log('ModbusClient', 'Establishing connection.', 
                    that.socketId, that.host, that.port);

        chrome.sockets.tcp.connect(that.socketId, that.host, that.port, function (result) {

            if (result !== 0) {

                console.log('ModbusClient', 'Connection failed.', result);

                that.fire('connect_error', {
                    errCode: 'connectionError',
                    result: result
                });

                return;
            
            }

            that.setState('online');

            console.log('ModbusClient', 'Connection successfull.');

            that.fire('connected');
        
        });

    };



    if (!this.inState('init')) {

        connect();
    
        return this;

    }
    
    console.log('ModbusClient', 'No socketId provided, creating socket.');

    chrome.sockets.tcp.create({}, function (createInfo) {

        console.log('ModbusClient', 'Socket created.', createInfo);

        that.socketId = createInfo.socketId;    

        chrome.sockets.tcp.onReceiveError.addListener(function () {

            console.log('ModbusClient', 'OnReceiveError called.');

            that.setState('error');

            that.fire('error');

        });

        connect();

    });

    return this;

});

ModbusClient.method('disconnect', function () {

    var that = this;

    console.log('ModbusClient', 'Disconnecting client.');

    chrome.sockets.tcp.disconnect(this.socketId, function () {

        console.log('ModbusClient', 'Client disconnected.');

        that.setState('offline');

        that.fire('disconnected');  
   
    });

    return this;

});

ModbusClient.method('reconnect', function () {

    var that = this;

    console.log('ModbusClient', 'Reconnecting client.');

    chrome.sockets.tcp.setPaused(this.socketId, false, function () {

        console.log('ModbusClient', 'Socket unpaused.');

        chrome.sockets.tcp.disconnect(that.socketId, function () {
        
            console.log('ModbusClient', 'Client disconnected.');

            chrome.sockets.tcp.connect(that.socketId, that.host, that.port, function (res) {
            
                if (res !== 0 && that.inState('error')) {
                
                    console.log('ModbusClient', 'Reconnecting failed.');

                    that.fire('error', [{
                        errCode: 'reconnectionFailed',
                        result: res
                    }]);

                    return;

                }

                if (res !== 0 && that.inState('offline')) {
            
                    console.log('ModbusClient', 'Connection failed.');

                    that.fire('connect_error', [{
                        errCode: 'connectionError',
                        result: res
                    }]);

                    return;

                }

                that.setState('online');

                console.log('ModbusClient', 'Connection successfull.');

                that.fire('connected');

            });

        });    
    
    });

});
