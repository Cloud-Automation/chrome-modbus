
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
        return new ModbusRequest(id, length);
    }

    var deferred   = $.Deferred(),
        packet     = new ArrayBuffer(length),
        header     = new DataView(packet, 0, 7),
        timeout    = null;

    header.setUint16(MBAP_TID, id);
    header.setUint16(MBAP_PID, 0);
    header.setUint16(MBAP_LEN, length - 6);
    header.setUint8(MBAP_UID, 255);

 
    this.getId = function () {
    
        return id;

    };

    this.getPacket = function () {
    
        return packet;

    };

    this.getPromise = function () {

        return deferred.promise();

    };

    this.reject = function () {

        deferred.reject.apply(null, arguments);

        return this;

    };

    this.resolve = function () {

        deferred.resolve.apply(null, arguments);

        return this;

    };

    this.getTimeout = function () {
    
        return timeout;

    };
    
    this.setTimeout = function (to) {

        timeout = to;

        return this;

    };

};

var ReadCoilsRequest = function (id, start, count) {

    if (!(this instanceof ReadCoilsRequest)) {
        return new ReadCoilsRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    var body = new DataView(this.getPacket(), 7, 5);

    body.setUint8(BODY_FC, READ_COILS); 
    body.setUint16(BODY_START, start);
    body.setUint16(BODY_COUNT, count);

    this.getStart = function () {
    
        return start;
    
    };

    this.getCount = function () {
    
        return count;
    
    };

    this.handleResponse = function (data, offset) {
 
        var mbap        = new DataView(data, offset, 7),
            pdu         = new DataView(data, offset + 7, 2),
            fc          = pdu.getUint8(0),
            byte_count  = pdu.getUint8(1);

        if (fc > 0x80) {
      
            this.reject({ errCode: 'serverError' });

            return 2;

        }

        var dv          = new DataView(data, offset + 9, byte_count),
            fc_data     = [], i, t, j, mask,
            c           = count;
        
        for (i = 0; i < count; i += 1) {
        
            t = dv.getUint8(i);

            for (j = 0; j < 7; j += 1) {
            
                mask = 1 << j;

                fc_data.push(t & mask !== 0);

                c -= 1;

                if (c === 0) {
                    break;
                }

            }

        }

        this.resolve(fc_data, this);

        return byte_count + 2;

    };

};

ReadCoilsRequest.inherits(ModbusRequest);

var ReadHoldingRegistersRequest = function (id, start, count) {

    if (!(this instanceof ReadHoldingRegistersRequest)) {
        return new ReadHoldingRegistersRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    var body = new DataView(this.getPacket(), 7, 5);

    body.setUint8(BODY_FC, READ_HOLDING_REGISTERS);
    body.setUint16(BODY_START, start);
    body.setUint16(BODY_COUNT, count);

    this.getStart = function () {
    
        return start;
    
    };

    this.getCount = function () {
    
        return count;
    
    };

    this.handleResponse = function (data, offset) {
     
        var mbap        = new DataView(data, offset, 7),
            pdu         = new DataView(data, offset + 7, 2),
            fc          = pdu.getUint8(0),
            byte_count  = pdu.getUint8(1);

        if (fc > 0x80) {
      
            this.reject({ errCode: 'serverError' });

            return 2;

        }

        var dv      = new DataView(data, offset + 7 + 2, byte_count),
            fc_data = [];

        for (var i = 0; i < byte_count / 2; i += 1) {
        
            fc_data.push(dv.getUint16(i * 2));
        
        }

        this.resolve(fc_data, this);

        return byte_count + 2;

    };
   
};

ReadHoldingRegistersRequest.inherits(ModbusRequest);

var ReadInputRegistersRequest = function (id, start, count) {

    if (!(this instanceof ReadInputRegistersRequest)) {
        return new ReadInputRegistersRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    var body = new DataView(this.getPacket(), 7, 5);

    body.setUint8(BODY_FC, READ_INPUT_REGISTERS); 
    body.setUint16(BODY_START, start);
    body.setUint16(BODY_COUNT, count);

    this.getStart = function () {
    
        return start;
    
    };

    this.getCount = function () {
    
        return count;
    
    };



    this.handleResponse = function (data, offset) {
     
        var mbap        = new DataView(data, offset, 7),
            pdu         = new DataView(data, offset + 7, 2),
            fc          = pdu.getUint8(0),
            byte_count  = pdu.getUint8(1);

        if (fc > 0x80) {
      
            this.reject({ errCode: 'serverError' });

            return 2;

        }

        var dv      = new DataView(data, offset + 7 + 2, byte_count),
            fc_data = [];

        for (var i = 0; i < byte_count / 2; i += 1) {
        
            fc_data.push(dv.getUint16(i * 2));
        
        }

        this.resolve(fc_data, this);

        return byte_count + 2;

    };

};

ReadInputRegistersRequest.inherits(ModbusRequest);

var WriteSingleCoilRequest = function (id, address, value) {

    if (!(this instanceof WriteSingleCoilRequest)) {
        return new WriteSingleCoildRequest(id, address, value);
    }

    ModbusRequest.call(this, id, 12);

    var body = new DataView(this.getPacket(), 7, 5);
 
    body.setUint8(BODY_FC, WRITE_SINGLE_COIL);
    body.setUint16(BODY_START, address);
    body.setUint16(BODY_COUNT, value?65280:0);

    this.getAddress = function () {
    
        return address;
    
    };

    this.getValue = function () {
    
        return value;
    
    };



    this.handleResponse = function (data, offset) {

        var mbap        = new DataView(data, offset, 7),
            pdu         = new DataView(data, offset + 7, 5),
            fc          = pdu.getUint8(0),
            start       = pdu.getUint8(1),
            value       = pdu.getUint16(3);

        if (fc > 0x80) {
      
            this.reject({ errCode: 'serverError' });

            return 2;

        }

        this.resolve(this);

        return 5;

    };
 
};


WriteSingleCoilRequest.inherits(ModbusRequest);

var WriteSingleRegisterRequest = function (id, address, value) {

    if (!(this instanceof WriteSingleRegisterRequest)) {
        return new WriteSingleRegisterRequest(id, address, value);
    }

    ModbusRequest.call(this, id, 12);

    var body = new DataView(this.getPacket(), 7, 5);

    body.setUint8(BODY_FC, WRITE_SINGLE_REGISTER);
    body.setUint16(BODY_START, address);
    body.setUint16(BODY_COUNT, value);

    this.getAddress = function () {
    
        return address;
    
    };

    this.getValue = function () {
    
        return value;
    
    };


    this.handleResponse = function (data, offset) {

        var mbap        = new DataView(data, offset, 7),
            pdu         = new DataView(data, offset + 7, 5),
            fc          = pdu.getUint8(0),
            start       = pdu.getUint16(1),
            value       = pdu.getUint16(3);

        if (fc > 0x80) {
      
            this.reject({ errCode: 'serverError' });

            return 2;

        }

        this.resolve(this);

        return 5;

    };

};

WriteSingleRegisterRequest.inherits(ModbusRequest);

ModbusClient = function (timeout) { 
   
    if (!(this instanceof ModbusClient))
        return new ModbusClient(timeout);

    // needed for the inheritance
    StateMachine.call(this, 'init');

    var host = 'localhost',
        port = 502,
        id = 0,
        requests = { },
        requestQueue = [],
        socketId,
        isWaiting = false;

    if (!timeout) {
        timeout = 5000;
    }

    // flush everything when going from error to online again
    this.on('state_changed', function (oldState, newState) {
    
        if (oldState === 'error' && newState === 'online') {
            sendPacket();
        }

    });

    this.on('error', function () {
    
        // remove all remaining packages

        for (var i in requestQueue) {
        
            requestQueue[i].reject({ errCode: 'connectionError' });

        }
    
    });

    var receiveListener = function (resp) { 

        var offset  = 0,
            data    = resp.data,
            request,
            byte_count;

        while (offset < data.byteLength) {

            if (data.byteLength - offset < 7) {
                console.log('ModbusClient', 'Wrong packet size.');
                return;
            }

            // read the header
            var mbap        = new DataView(data, offset + 0, 7),
                tid         = mbap.getUint16(0);

            request         = requests[tid];

            if (!request) {

                // if there is no handler just skip this package

                // offset += 7 + 2 + byte_count;

                // TODO: handle this with a list of fc -> byte_count                 
                return;
               
            }

            // cleartimeout
            clearTimeout(request.getTimeout()); 

            // handle fc response       
            byte_count = request.handleResponse(data, offset);     
              
            // delete the handler
            delete requests[tid];

            offset += 7;
            offset += byte_count;
        
        }

    }.bind(this);

    var createNewId = function () {

        id = (id + 1) % 10000;
   
        return id;

    }.bind(this);

    var sendPacket = function (req) {
       
        // just push the request to the queue 
        if (arguments.length > 0) {
            requestQueue.push(req);
        }

        // invalid states for sending packages
        if (isWaiting || !this.inState('online')) {
            return;
        }

        // no requests in line
        if (requestQueue.length === 0) {
            return;
        }

        isWaiting = true;

        var request = requestQueue.shift();

        // Before sending set the timeout for this request

        var timeout_no = setTimeout(function () {
 
            console.log('ModbusClient', 'Timeout occured.');

            if (this.inState('error')) {
                
                request.reject({ 
                    errCode: 'error' 
                });
                
                return;
            
            }

            this.setState('error');
            request.reject({ errCode: 'timeout' });
            this.fire('error', [ { errCode: 'timeout' }]); 
       
            delete requests[request.id];

        }.bind(this), timeout);

        request.setTimeout(timeout_no);

        // Send the packet

        chrome.sockets.tcp.send(

            socketId, request.getPacket(), function (sendInfo) {
   
            if (sendInfo.resultCode < 0) {
            
                console.log('ModbusClient', 'A error occured while sending packet.', sendInfo.resultCode);

                this.setState('error');
                this.fire('error', { errCode: 'sendError' });
                isWaiting = false;

                return;

            }

            isWaiting = false;

            sendPacket();
        
        }.bind(this));

    }.bind(this);


    this.readCoils = function (start, count) {

        var request = new ReadCoilsRequest(createNewId(), start, count);

        if (!this.inState('online')) {
            request.reject({ errCode: 'offline' });
            return request.getPromise();
        }

        requests[request.getId()] = request;

        sendPacket(request);

        return request.getPromise();

    };

    this.readHoldingRegisters = function (start, count) {

        var request = new ReadHoldingRegistersRequest(createNewId(), start, count);

        if (!this.inState('online')) {
            request.reject({ errCode: 'offline' });
            return request.getPromise();
        }

        requests[request.getId()] = request;

        sendPacket(request);

        return request.getPromise();

    };


    this.readInputRegisters = function (start, count) {

        var request = new ReadInputRegistersRequest(createNewId(), start, count);

        if (!this.inState('online')) {
            request.reject({ errCode: 'offline' });
            return request.getPromise();
        }

        requests[request.getId()] = request;

        sendPacket(request);

        return request.getPromise();

    };

    this.writeSingleCoil = function (address, value) {

        var request = new WriteSingleCoilRequest(createNewId(), address, value);

        if (!this.inState('online')) {
            request.reject({ errCode: 'offline' });
            return request.getPromise();
        }

        requests[request.getId()] = request;

        sendPacket(request);

        return request.getPromise();

    };

    this.writeSingleRegister = function (address, value) {

        var request = new WriteSingleRegisterRequest(createNewId(), address, value);

        if (!this.inState('online')) {
            request.reject({ errCode: 'offline' });
            return request.getPromise();
        }

        requests[request.getId()] = request;

        sendPacket(request);

        return request.getPromise();

    };


    this.connect = function (h, p) {

        host = h; 
        port = p;

        var connect = function () { 
        
            console.log('ModbusClient', 'Establishing connection.', 
                        socketId, host, port);

            chrome.sockets.tcp.connect(socketId, host, port, function (result) {

                if (result !== 0) {

                    console.log('ModbusClient', 'Connection failed.', result);

                    this.fire('connect_error', [{
                        errCode: 'connectionError',
                        result: result
                    }]);

                    return;
                
                }

                this.setState('online');

                console.log('ModbusClient', 'Connection successfull.');

                this.fire('connected');
            
            }.bind(this));

        }.bind(this);



        if (!socketId) {
       
            console.log('ModbusClient', 'No socketId provided, creating socket.');

            chrome.sockets.tcp.create({}, function (createInfo) {

                console.log('ModbusClient', 'Socket created.', createInfo);

                socketId = createInfo.socketId;    

                chrome.sockets.tcp.onReceiveError.addListener(function () {

                    console.log('ModbusClient', 'OnReceiveError called.');

                    if (!this.inState('online')) {

                        console.log('ModbusClient', 'Client is not in state online an a error occured. We ll just leave it be.');

                        return;
                    }


                    this.setState('error');

                    this.fire('error', [{ errCode: 'ServerError' }]);

                }.bind(this));

                connect();

            }.bind(this));

        } else {

            connect();
        
        }

        return this;
     

    };

    this.disconnect = function (cb) {

        console.log('ModbusClient', 'Disconnecting client.');

        chrome.sockets.tcp.disconnect(socketId, function () {

            console.log('ModbusClient', 'Client disconnected.');

            this.setState('offline');

            this.fire('disconnected');  

            if (!cb) 
                return;

            cb();
       
        }.bind(this));

        return this;

    };

    this.close = function (cb) {

        this.disconnect(function () {

            console.log('ModbusClient', 'Close socket.');

            chrome.sockets.tcp.close(socketId, function () {
        
                console.log('ModbusClient', 'Client closed.');

                this.setState('offline');

                socketId = null;

                this.fire('closed');

                if (!cb)
                    return;
        
            }.bind(this));

        }.bind(this));

    };

    this.reconnect = function () {

        console.log('ModbusClient', 'Reconnecting client.');

        chrome.sockets.tcp.setPaused(socketId, false, function () {

            console.log('ModbusClient', 'Socket unpaused.');

            chrome.sockets.tcp.disconnect(socketId, function () {
            
                console.log('ModbusClient', 'Client disconnected.');

                chrome.sockets.tcp.connect(socketId, host, port, function (res) {
                
                    if (res !== 0 && this.inState('error')) {
                    
                        console.log('ModbusClient', 'Reconnecting failed.');

                        this.fire('error', [{
                            errCode: 'reconnectionFailed',
                            result: res
                        }]);

                        return;

                    }

                    if (res !== 0 && this.inState('offline')) {
                
                        console.log('ModbusClient', 'Connection failed.');

                        this.fire('connect_error', [{
                            errCode: 'connectionError',
                            result: res
                        }]);

                        return;

                    }

                    this.setState('online');

                    console.log('ModbusClient', 'Connection successfull.');

                    this.fire('connected');

                }.bind(this));

            }.bind(this));    
        
        }.bind(this));

    };
    
    chrome.sockets.tcp.onReceive.addListener(receiveListener);

};


ModbusClient.inherits(StateMachine);


