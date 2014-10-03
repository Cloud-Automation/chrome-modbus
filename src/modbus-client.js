// constants

var MBAP_TID                = 0,
    MBAP_PID                = 2,
    MBAP_LEN                = 4,
    MBAP_UID                = 6,
    BODY_FC                 = 0,
    BODY_START              = 1,
    BODY_COUNT              = 3,
    READ_COILS              = 1,
    READ_HOLDING_REGISTERS  = 3,
    READ_INPUT_REGISTERS    = 4,
    WRITE_SINGLE_COIL       = 5,
    WRITE_SINGLE_REGISTER   = 6;

var ModbusRequest = function (id, length) {

    if (!(this instanceof ModbusRequest)) {
        return new ModbusRequest(id);
    }

    this.id         = id;
    this.length     = length;
    this.deferred   = $.Deferred();

    this.packet     = new ArrayBuffer(length);
    this.header     = new DataView(this.packet, 0, 7);

    this.timeout    = null;

    this.setTID(id)
        .setPID(0)
        .setLength(length - 6)
        .setUID(255);

};

ModbusRequest.method('setTID', function (id) {

    this.header.setUint16(MBAP_TID, id);
    this.id = id;

    return this;

});

ModbusRequest.method('setPID', function (pid) {

    this.header.setUint16(MBAP_PID, pid);
    this.pid = pid;

    return this;

});

ModbusRequest.method('setLength', function (len) {

    this.header.setUint16(MBAP_LEN, len);
    this.length = len;

    return this;

});

ModbusRequest.method('setUID', function (uid) {

    this.header.setUint8(MBAP_UID, uid);
    this.uid = uid;

    return this;

});

ModbusRequest.method('getPromise', function () {

    return this.deferred.promise();

});

ModbusRequest.method('reject', function () {

    this.deferred.reject.apply(null, arguments);

    return this;

});

ModbusRequest.method('resolve', function () {

    this.deferred.resolve.apply(null, arguments);

    return this;

});

ModbusRequest.method('setTimeout', function (timeout) {

    this.timeout = timeout;

    return this;

});

var ReadCoilsRequest = function (id, start, count) {

    if (!(this instanceof ReadCoilsRequest)) {
        return new ReadCoilsRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    this.start  = start;
    this.count  = count;

    this.body   = new DataView(this.packet, 7, 5);

    this.body.setUint8(BODY_FC, READ_COILS);
    
    this.setStart(start).setCount(count);

};

ReadCoilsRequest.inherits(ModbusRequest);

ReadCoilsRequest.method('setStart', function (start) {

    this.body.setUint16(BODY_START, start);
    this.start = start;

    return this;

});

ReadCoilsRequest.method('setCount', function (count) {

    this.body.setUint16(BODY_COUNT, count);
    this.count = count;

    return this;

});

ReadCoilsRequest.method('handleResponse', function (data, offset) {
 
    var mbap        = new DataView(data, offset, 7),
        pdu         = new DataView(data, offset + 7, 2),
        fc          = pdu.getUint8(0),
        byte_count  = pdu.getUint8(1);

    if (fc > 0x80) {
  
        this.deferred.reject({ errCode: 'serverError' });

        return false;

    }


    var dv          = new DataView(data, offset + 9, byte_count),
        fc_data     = [], i, t, j, mask,
        count       = this.count,
        fc_data     = []; 

    for (i = 0; i < this.count; i += 1) {
    
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

    this.deferred.resolve(fc_data, this);

    return true;

});

var ReadHoldingRegistersRequest = function (id, start, count) {

    if (!(this instanceof ReadHoldingRegistersRequest)) {
        return new ReadHoldingRegistersRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    this.start  = start;
    this.count  = count;

    this.body   = new DataView(this.packet, 7, 5);

    this.body.setUint8(BODY_FC, READ_HOLDING_REGISTERS);
    
    this.setStart(start).setCount(count);

};

ReadHoldingRegistersRequest.inherits(ModbusRequest);

ReadHoldingRegistersRequest.method('setStart', function (start) {

    this.body.setUint16(BODY_START, start);
    this.start = start;

    return this;

});

ReadHoldingRegistersRequest.method('setCount', function (count) {

    this.body.setUint16(BODY_COUNT, count);
    this.count = count;

    return this;

});

ReadHoldingRegistersRequest.method('handleResponse', function (data, offset) {
 
    var mbap        = new DataView(data, offset, 7),
        pdu         = new DataView(data, offset + 7, 2),
        fc          = pdu.getUint8(0),
        byte_count  = pdu.getUint8(1);

    if (fc > 0x80) {
  
        this.deferred.reject({ errCode: 'serverError' });

        return false;

    }

    var dv      = new DataView(data, offset + 7 + 2, byte_count),
        fc_data = [];

    for (var i = 0; i < byte_count / 2; i += 1) {
    
        fc_data.push(dv.getUint16(i * 2));
    
    }

    this.deferred.resolve(fc_data, this);

    return true;

});


var ReadInputRegistersRequest = function (id, start, count) {

    if (!(this instanceof ReadInputRegistersRequest)) {
        return new ReadInputRegistersRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    this.start  = start;
    this.count  = count;

    this.body   = new DataView(this.packet, 7, 5);

    this.body.setUint8(BODY_FC, READ_INPUT_REGISTERS);
    
    this.setStart(start).setCount(count);

};

ReadInputRegistersRequest.inherits(ModbusRequest);

ReadInputRegistersRequest.method('setStart', function (start) {

    this.body.setUint16(BODY_START, start);
    this.start = start;

    return this;

});

ReadInputRegistersRequest.method('setCount', function (count) {

    this.body.setUint16(BODY_COUNT, count);
    this.count = count;

    return this;

});

ReadInputRegistersRequest.method('handleResponse', function (data, offset) {
 
    var mbap        = new DataView(data, offset, 7),
        pdu         = new DataView(data, offset + 7, 2),
        fc          = pdu.getUint8(0),
        byte_count  = pdu.getUint8(1);

    if (fc > 0x80) {
  
        this.deferred.reject({ errCode: 'serverError' });

        return false;

    }

    var dv      = new DataView(data, offset + 7 + 2, byte_count),
        fc_data = [];

    for (var i = 0; i < byte_count / 2; i += 1) {
    
        fc_data.push(dv.getUint16(i * 2));
    
    }

    this.deferred.resolve(fc_data, this);

    return true;

});

WriteSingleCoilRequest = function (id, address, value) {

    if (!(this instanceof WriteSingleCoilRequest)) {
        return new WriteSingleCoildRequest(id, address, value);
    }

    ModbusRequest.call(this, id, 12);

    this.address    = address;
    this.value      = value;

    this.body       = new DataView(this.packet, 7, 5);
 
    this.body.setUint8(BODY_FC, WRITE_SINGLE_COIL);
   
    this.setAddress(address).setValue(value);
 
};


WriteSingleCoilRequest.inherits(ModbusRequest);

WriteSingleCoilRequest.method('setAddress', function (address) {

    this.body.setUint16(BODY_START, address);
    this.address = address;

    return this;

});

WriteSingleCoilRequest.method('setValue', function (value) {

    this.body.setUint16(BODY_COUNT, value?65280:0);
    this.value = value;

    return this;

});

WriteSingleCoilRequest.method('handleResponse', function (data, offset) {

    var mbap        = new DataView(data, offset, 7),
        pdu         = new DataView(data, offset + 7, 2),
        fc          = pdu.getUint8(0),
        byte_count  = pdu.getUint8(1);

    if (fc > 0x80) {
  
        this.deferred.reject({ errCode: 'serverError' });

        return false;

    }


    this.deferred.resolve(this);

    return true;

});

WriteSingleRegisterRequest = function (id, address, value) {

    if (!(this instanceof WriteSingleRegisterRequest)) {
        return new WriteSingleRegisterRequest(id, address, value);
    }

    ModbusRequest.call(this, id, 12);

    this.address        = address;
    this.value          = value;

    this.body           = new DataView(this.packet, 7, 5);

    this.body.setUint8(BODY_FC, WRITE_SINGLE_REGISTER);

    this.setAddress(address).setValue(value);

};

WriteSingleRegisterRequest.inherits(ModbusRequest);

WriteSingleRegisterRequest.method('setAddress', function (address) {

    this.body.setUint16(BODY_START, address);
    this.address = address;

    return this;

});

WriteSingleRegisterRequest.method('setValue', function (value) {

    this.body.setUint16(BODY_COUNT, value);
    this.value = value;

    return this;

});

WriteSingleRegisterRequest.method('handleResponse', function (data, offset) {

    var mbap        = new DataView(data, offset, 7),
        pdu         = new DataView(data, offset + 7, 2),
        fc          = pdu.getUint8(0),
        byte_count  = pdu.getUint8(1);

    if (fc > 0x80) {
  
        this.deferred.reject({ errCode: 'serverError' });

        return false;

    }

    this.deferred.resolve(this);

    return true;


});

ModbusClient = function (timeout) { 
   
    if (!(this instanceof ModbusClient)) {
        return new ModbusClient(timeout);
    }

    // needed for the inheritance
    StateMachine.call(this, 'init');

    this.host           = 'localhost';
    this.port           = 502;
    this.timeout        = timeout||5000;

    this.id             = 0;

    this._requests      = { };
    this._requestQueue  = [];

    var that            = this;


    // flush everything when going from error to online again
    this.on('state_changed', function (oldState, newState) {
    
        if (oldState === 'error' && newState === 'online') {
            this._sendPacket();
        }

    });

    this.on('error', function () {
    
        // remove all remaining packages

        for (var i in this._pQueue) {
        
            this._requestQueue[i].reject({ errCode: 'connectionError' });

        }
    
    });

    this._receiveListener = function (resp) { 

        var offset  = 0,
            data    = resp.data,
            request;

        while (offset < data.byteLength) {

            // read the header
            var mbap        = new DataView(data, offset + 0, 7),
                tid         = mbap.getUint16(0),
                pdu         = new DataView(data, offset + 7, 2),
                byte_count  = pdu.getUint8(1);

            request = this._requests[tid];

            if (!request) {

                // if there is no handler just skip this package

                offset += 9 + byte_count;

                continue;
               
            }

            // cleartimeout

            clearTimeout(request.timeout); 

            // handle fc response
       
            request.handleResponse(data, offset);     
              
            // delete the handler

            delete this._requests[tid];

            offset += 7 + 2 + byte_count;
        
        }

    };

    this._createNewId = function () {

        this.id = (this.id + 1) % 10000;
   
        return this.id;

    };

    this._sendPacket = function (request) {
       
        // just push the request to the queue 
        if (arguments.length > 0) {
            this._requestQueue.push(request);
        }

        // invalid states for sending packages
        if (this._isWaiting || !this.inState('online')) {
            return;
        }

        // no requests in line
        if (this._requestQueue.length === 0) {
            return;
        }

        this._isWaiting = true;

        var request = this._requestQueue.shift();

        // Before sending set the timeout for this request

        var timeout = setTimeout(function () {
 
            if (this.inState('error')) {
                request.reject({ errCode: 'error' });
                return;
            }

            this.setState('error');
            request.reject({ errCode: 'timeout' });
            this.fire('error', [ { errCode: 'timeout' }]); 
       
            delete this._requests[request.id];

        }.bind(this), this.timeout);

        request.setTimeout(timeout);

        // Send the packet

        chrome.sockets.tcp.send(

            this.socketId, request.packet, function (sendInfo) {
   
            if (sendInfo.resultCode < 0) {
            
                console.log('ModbusClient', 'A error occured while sending packet.', sendInfo.resultCode);

                this.setState('error');
                this._isWaiting = false;

                return;

            }

            this._isWaiting = false;

            this._sendPacket();
        
        }.bind(this));

    };


    chrome.sockets.tcp.onReceive.addListener(this._receiveListener.bind(this));

};


ModbusClient.inherits(StateMachine);

ModbusClient.method('readCoils', function (start, count) {

    var request = new ReadCoilsRequest(this._createNewId(), start, count);

    if (!this.inState('online')) {
        request.reject({ errCode: 'offline' });
        return request.getPromise();
    }

    this._requests[request.id] = request;

    this._sendPacket(request);

    return request.getPromise();

});

ModbusClient.method('readHoldingRegisters', function (start, count) {

    var request = new ReadHoldingRegistersRequest(this._createNewId(), start, count);

    if (!this.inState('online')) {
        request.reject({ errCode: 'offline' });
        return request.getPromise();
    }

    this._requests[request.id] = request;

    this._sendPacket(request);

    return request.getPromise();

});


ModbusClient.method('readInputRegisters', function (start, count) {

    var request = new ReadInputRegistersRequest(this._createNewId(), start, count);

    if (!this.inState('online')) {
        request.reject({ errCode: 'offline' });
        return request.getPromise();
    }

    this._requests[request.id] = request;

    this._sendPacket(request);

    return request.getPromise();

});

ModbusClient.method('writeSingleCoil', function (address, value) {

    var request = new WriteSingleCoilRequest(this._createNewId(), address, value);

    if (!this.inState('online')) {
        request.reject({ errCode: 'offline' });
        return request.getPromise();
    }

    this._requests[request.id] = request;

    this._sendPacket(request);

    return request.getPromise();

});

ModbusClient.method('writeSingleRegister', function (address, value) {

    var request = new WriteSingleRegisterRequest(this._createNewId(), address, value);

    if (!this.inState('online')) {
        request.reject({ errCode: 'offline' });
        return request.getPromise();
    }

    this._requests[request.id] = request;

    this._sendPacket(request);

    return request.getPromise();

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

                that.fire('connect_error', [{
                    errCode: 'connectionError',
                    result: result
                }]);

                return;
            
            }

            that.setState('online');

            console.log('ModbusClient', 'Connection successfull.');

            that.fire('connected');
        
        });

    };



    if (!this.socketId) {
   
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

    } else {

        connect();
    
    }

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
