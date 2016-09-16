
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
    WRITE_SINGLE_REGISTER   = 6,
    WRITE_MULTIPLE_REGISTERS = 16;

var ModbusRequest = function (id, length) {

    if (!(this instanceof ModbusRequest)) {
        return new ModbusRequest(id, length);
    }

    var deferred   = $.Deferred(),
        packet     = new ArrayBuffer(length),
        header     = new DataView(packet, 0, 7),
        timeout    = null;

    var init = function () {
 
        header.setUint16(MBAP_TID, id);
        header.setUint16(MBAP_PID, 0);
        header.setUint16(MBAP_LEN, length - 6);
        header.setUint8(MBAP_UID, 255);
    
    }.bind(this);


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
    
    this.setTimeout = function (to) {

        timeout = to;

        return this;

    };

    init();

};

var ReadCoilsRequest = function (id, start, count) {

    if (!(this instanceof ReadCoilsRequest)) {
        return new ReadCoilsRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    var body;

    var init = function () {
 
        body = new DataView(this.getPacket(), 7, 5);

        body.setUint8(BODY_FC, READ_COILS); 
        body.setUint16(BODY_START, start);
        body.setUint16(BODY_COUNT, count);
    
    }.bind(this);

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

    init();

};

ReadCoilsRequest.inherits(ModbusRequest);

var ReadHoldingRegistersRequest = function (id, start, count) {

    if (!(this instanceof ReadHoldingRegistersRequest)) {
        return new ReadHoldingRegistersRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    var body;
   
    var init = function () {
    
        body = new DataView(this.getPacket(), 7, 5);

        body.setUint8(BODY_FC, READ_HOLDING_REGISTERS);
        body.setUint16(BODY_START, start);
        body.setUint16(BODY_COUNT, count);

    }.bind(this);

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
   
    init();

};

ReadHoldingRegistersRequest.inherits(ModbusRequest);

var ReadInputRegistersRequest = function (id, start, count) {

    if (!(this instanceof ReadInputRegistersRequest)) {
        return new ReadInputRegistersRequest(id, start, count);
    }

    ModbusRequest.call(this, id, 12);

    var body;
   
    var init = function () {
    
        body = new DataView(this.getPacket(), 7, 5);

        body.setUint8(BODY_FC, READ_INPUT_REGISTERS); 
        body.setUint16(BODY_START, start);
        body.setUint16(BODY_COUNT, count);

    }.bind(this);

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

    init();

};

ReadInputRegistersRequest.inherits(ModbusRequest);

var WriteSingleCoilRequest = function (id, address, value) {

    if (!(this instanceof WriteSingleCoilRequest)) {
        return new WriteSingleCoildRequest(id, address, value);
    }

    ModbusRequest.call(this, id, 12);

    var body;
   
    var init = function () {
       
        body = new DataView(this.getPacket(), 7, 5);
 
        body.setUint8(BODY_FC, WRITE_SINGLE_COIL);
        body.setUint16(BODY_START, address);
        body.setUint16(BODY_COUNT, value?65280:0);

    }.bind(this);

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
 
    init();

};


WriteSingleCoilRequest.inherits(ModbusRequest);

var WriteSingleRegisterRequest = function (id, address, value) {

    if (!(this instanceof WriteSingleRegisterRequest)) {
        return new WriteSingleRegisterRequest(id, address, value);
    }

    ModbusRequest.call(this, id, 12);

    var body;
   
    var init = function () {
       
        body = new DataView(this.getPacket(), 7, 5);

        body.setUint8(BODY_FC, WRITE_SINGLE_REGISTER);
        body.setUint16(BODY_START, address);
        body.setUint16(BODY_COUNT, value);

    }.bind(this);

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

    init();

};

WriteSingleRegisterRequest.inherits(ModbusRequest);

var WriteMultipleRegistersRequest = function (id, address, values) {

    if (!(this instanceof WriteMultipleRegistersRequest)) {
        return new WriteMultipleRegistersRequest(id, address, values);
    }

    ModbusRequest.call(this, id, 7 + 6 + (values.length * 2));

    var body;
   
    var init = function () {
       
        body = new DataView(this.getPacket(), 7, 6 + (values.length * 2));

        body.setUint8(BODY_FC, WRITE_MULTIPLE_REGISTERS);
        body.setUint16(1, address);
        body.setUint16(3, values.length);
        body.setUint8(5, 2 * values.length);
        values.forEach(function (v, i) {
            body.setUint16(6 + (i * 2), v);
        });

    }.bind(this);

    this.getAddress = function () {
    
        return address;
    
    };

    this.getValues = function () {
    
        return values;
    
    };


    this.handleResponse = function (data, offset) {

        var mbap        = new DataView(data, offset, 7),
            pdu         = new DataView(data, offset + 7, 5),
            fc          = pdu.getUint8(0),
            start       = pdu.getUint16(1),
            quant       = pdu.getUint16(3);

        if (fc > 0x80) {
      
            this.reject({ errCode: 'serverError' });

            return 2;

        }

        this.resolve(this);

        return 5;

    };

    init();

};

WriteMultipleRegistersRequest.inherits(ModbusRequest);


var ModbusRequestManager = function () {

    if (!(this instanceof ModbusRequestManager))
        return new ModbusRequestManager();

    StateMachine.call(this, 'ready');

    var queue           = [],
        currentRequest  = null,
        socketId        = null,
        receiveBuffer   = [ ];

    var init = function () {
    
        chrome.sockets.tcp.onReceive.addListener(receiveListener);

        this.on('state_changed', function onStateChanged (oldState, newState) {
       
            if (newState === 'ready')
                send();
        
        }.bind(this));

    }.bind(this);

    var receiveListener = function (info) {

        if (info.socketId !== socketId) {

            return;

        }


        if (this.inState('waiting')) {

            receiveBuffer.push(info);

            handleResponse();

        } else {
        
            throw new Error('ModbusRequestManager - Received Packet while in state "waiting".');
        
        }

    }.bind(this);


    var handleResponse = function handleResponse () {

        console.log('ModbusRequestManager', 'Trying to handle response.');

        if (receiveBuffer.length === null) {
            return;
        }

        var response    = receiveBuffer.shift(),
            data        = response.data;

        if (data.byteLength < 7) {

            console.log('ModbusRequestManager', 'Wrong packet size.', (data.byteLength));
            return;

        }

        // read the header
        var mbap            = new DataView(data, 0, 7),
            tid             = mbap.getUint16(0);

        if (!currentRequest) {

            console.error('ModbusRequestManager', 'No current request, strange!!', currentRequest);

            return;
           
        }

        if (currentRequest.getId() !== tid) {
        
            console.error('ModbusRequestManager', 'CurrentRequest tid !== received tid', currentRequest.getId(), tid);

            return;
        
        }

        console.log('ModbusRequestManager', 'Request handled fine.');

        // cleartimeout
        clearTimeout(currentRequest.getTimeout()); 

        // handle fc response       
        currentRequest.handleResponse(data, 0); 

        this.setState('ready');
       
    }.bind(this);


    var send = function () {

        if (queue.length === 0) {
            console.log('ModbusRequestManager', 'Nothing in Queue.');
            return;
        }

        this.setState('sending');

        console.log('ModbusRequestManager', 'Trying to send packet.');

        currentRequest = queue.shift();

        // Before sending set the timeout for this request

        var timeout_no = setTimeout(function () {
 
            console.log('ModbusRequestManager', 'Timeout occured.');

            currentRequest.reject({ errCode: 'timeout' });
      
            this.fire('error', [{ errCode: 'timeout' }]);

        }.bind(this), 5000);

        currentRequest.setTimeout(timeout_no);

        console.log('ModbusRequestManager', 'Sending packet...');

        chrome.sockets.tcp.send(socketId, currentRequest.getPacket(), function (sendInfo) {
  
            if (sendInfo.resultCode < 0) {
            
                console.log('ModbusRequestManager', 'A error occured while sending packet.', sendInfo.resultCode);

                currentRequest.reject({ errCode: 'sendError' });

                this.setState('ready');

                return;

            }

            console.log('ModbusRequestManager', 'Packet send! Waiting for response.');
       
            this.setState('waiting');

        }.bind(this));
    
    }.bind(this);

    this.setSocketId = function (id) {
    
        socketId = id;

        return this;
    
    };

    this.sendPacket = function (packet) {

        console.log('ModbusRequestManager', 'Queing a new packet.');

        queue.push(packet);
   
        if (socketId === null) {
            throw new Error('ModbusRequestManager - No socketId provided.');
        }

        if (!this.inState('ready')) {
            return;
        }

        send();  

        return this;

    };

    this.clear = function () {
    
        while (queue.length > 0) {
            queue.pop().reject({ 'errCode' : 'clientOffline' });
        }

        this.setState('ready');
    
    };

    this.flush = function () {
   
        console.log('ModbusRequestManager', 'Flush');

        if (socketId === null) {
            return;
        }

        send();

        return this;
    
    };

    init();

};

ModbusRequestManager.inherits(StateMachine);


ModbusClient = function (timeout, autoreconnect) { 
   
    if (!(this instanceof ModbusClient))
        return new ModbusClient(timeout, autoreconnect);

    // needed for the inheritance
    StateMachine.call(this, 'init');

    var host            = 'localhost',
        port            = 502,
        id              = 0,
        requestManager  = new ModbusRequestManager(),
        isWaiting       = false,
        isReconnecting  = false,
        socketId;

    var init = function init () {
 
        if (!timeout) 
            timeout = 5000;
   
        requestManager.on('error', function (err) {
       
            if (this.inState('offline')) {
                return;
            }

            this.fire('error', [err]);
            
            if (autoreconnect) {
                this.reconnect();
            } else {
                this.disconnect();
            }
        
        }.bind(this)); 

        // flush everything when going from error to online again
        this.on('state_changed', function (oldState, newState) {

            console.log('state changed', oldState, newState);

            this.fire(newState);

            if (oldState === 'error' && newState === 'online') {

                requestManager.flush();

            }
        
        }.bind(this));

        this.on('offline', function () {

            requestManager.clear();        
        
        }.bind(this));

        this.on('online', function () {
        
            isReconnecting = false;
        
        }.bind(this));

        this.on('error', function () {
        
            isReconnecting = false;
        
        }.bind(this));

        createSocket();

    }.bind(this);

    var onReceiveError = function onReceiveError (info) {
 
        console.log('ModbusClient', 'Receive Error occured.', info, socketId);

        if (info.socketId !== socketId) 
            return;


        this.setState('offline');
        this.fire('error', [{ errCode: 'ServerError', args: arguments }]);

        if (autoreconnect) {

            console.log('ModbusClient', 'AutoReconnect enabled, reconnecting.');

            this.reconnect();

            return;

        }

        console.log('ModbusClient', 'Disconnecting client.');

        this.close(); 
    
    }.bind(this);

    var createSocket = function createSocket () {
           
        console.log('ModbusClient', 'Creating socket.');

        chrome.sockets.tcp.onReceiveError.addListener(onReceiveError);

        chrome.sockets.tcp.create({}, function (createInfo) {

            console.log('ModbusClient', 'Socket created.', createInfo);

            socketId = createInfo.socketId;    

            requestManager.setSocketId(socketId);

            this.setState('offline');
            this.fire('ready');

        }.bind(this));
    
    }.bind(this);

    var createNewId = function () {

        id = (id + 1) % 10000;
  
        return id;

    }.bind(this);

    var sendPacket = function (req) {
       
        // invalid states for sending packages
        if (!this.inState('online')) {

            return;

        }

        requestManager.sendPacket(req);

    }.bind(this);

    this.isOnline = function () {
    
        return this.inState('online');

    }.bind(this);
 

    this.readCoils = function (start, count) {

        var request = new ReadCoilsRequest(createNewId(), start, count);

        if (!this.inState('online')) {

            request.reject({ errCode: 'offline' });
            return request.getPromise();

        }

        sendPacket(request);

        return request.getPromise();

    };

    this.readHoldingRegisters = function (start, count) {

        var request = new ReadHoldingRegistersRequest(createNewId(), start, count);

        if (!this.inState('online')) {

            request.reject({ errCode: 'offline' });
            return request.getPromise();

        }

        sendPacket(request);

        return request.getPromise();

    };


    this.readInputRegisters = function (start, count) {

        var request = new ReadInputRegistersRequest(createNewId(), start, count);

        if (!this.inState('online')) {

            request.reject({ errCode: 'offline' });
            return request.getPromise();

        }

        sendPacket(request);

        return request.getPromise();

    };

    this.writeSingleCoil = function (address, value) {

        var request = new WriteSingleCoilRequest(createNewId(), address, value);

        if (!this.inState('online')) {

            request.reject({ errCode: 'offline' });
            return request.getPromise();

        }

        sendPacket(request);

        return request.getPromise();

    };

    this.writeSingleRegister = function (address, value) {

        var request = new WriteSingleRegisterRequest(createNewId(), address, value);

        if (!this.inState('online')) {

            request.reject({ errCode: 'offline' });
            return request.getPromise();

        }

        sendPacket(request);

        return request.getPromise();

    };

    this.writeMultipleRegisters = function (address, values) {
    
        var request = new WriteMultipleRegistersRequest(createNewId(), address, values);

        if (!this.inState('online')) {
        
            request.reject({ errCode: 'offline' });
            return request.getPromise();

        }

        sendPacket(request);

        return request.getPromise();
    
    };

    var connect = function () {

        if (this.inState('connecting') || this.inState('online')) {
            return;
        }

        this.setState('connecting');
        this.fire('busy');

        console.log('ModbusClient', 'Establishing connection.', socketId, host, port);

        chrome.sockets.tcp.connect(socketId, host, port, function (result) {

            console.log('ModbusClient', 'Connect returned', arguments);

            if (result !== 0) {

                console.log('ModbusClient', 'Connection failed.', result);

                this.fire('error', [{
                    errCode: 'connectionError',
                    result: result
                }]);


                if (autoreconnect) {
                
                    console.log('ModbusClient', 'Auto Reconnect enabled, trying to reconnect.');

                    this.reconnect(5000);
                
                }

                return;
            
            }

            console.log('ModbusClient', 'Connection successfull.');

            this.setState('online');

        
        }.bind(this));

        return this;
     
    }.bind(this);

    this.setHost = function (h) {
    
        host = h;

        return this;
    
    };

    this.setPort = function (p) {
    
        port = p;

        return this;
    
    };

    this.getHost = function () {
        return host;
    };

    this.getPort = function () {
        return port;
    };

    this.connect = function () {
    
        connect();
   
        return this; 

    };

    this.disconnect = function (cb) {

        if (this.inState('disconnecting')) {
            return;
        }

        this.setState('disconnecting');
        this.fire('busy');

        console.log('ModbusClient', 'Disconnecting client.');

        chrome.sockets.tcp.disconnect(socketId, function () {

            console.log('ModbusClient', 'Client disconnected.');


            this.setState('offline');

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

                this.setState('init');

                socketId = null;

                if (!cb)
                    return;
        
            }.bind(this));

        }.bind(this));

    };

    var reconnect = function () {
   
        if (this.inState('offline')) {
        
            console.log('ModbusClient', 'Client already disconnected.');

            connect();

            return;

        }

        chrome.sockets.tcp.disconnect(socketId, function () {

            console.log('ModbusClient', 'Client disconnected.', arguments);

            this.setState('offline');

            connect();

        }.bind(this));    
        
    }.bind(this);

    this.reconnect = function (wait) {

        if (isReconnecting)
            return;

        isReconnecting = true;

        this.fire('reconnecting');

        setTimeout(function () {
        
            reconnect();
        
        }.bind(this), wait?wait:0);


    };

    init();    

};


ModbusClient.inherits(StateMachine);


