(function () { 
  
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



    ModbusClient = function (con) { 
       
        if (!(this instanceof ModbusClient)) {
            return new ModbusClient(con);
        }

        // needed for the inheritance
        Events.call(this);

        this.con        = con;

        this.state      = 'offline';

        this.id         = 0;
        this.handler    = { };

        var that        = this;

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

                    // we do not need a handler for
                    // old packages, just wipe them !!!

/*                    that.fire('error', [
                        {
                            'errCode'   : 'noHandler',
                            'tid'       : tid 
                        }
                    ]); */
 
                    offset += 9 + res.pdu.byte_count;

                    hasMore = offset < data.byteLength;

                    continue;
                   
                }

                // cleartimeout
                
                clearTimeout(that.handler[tid].timeout);
                

                // handle fc response
           
                var rHandler = that._responseHandler[res.pdu.fc];

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
                    uHandler.callback.rsolve(res);
                }
                   
                // delete the handler

                delete that.handler[tid];

                offset += 9 + res.pdu.byte_count;

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

            var dv = new DataView(data, offset + 9, response.pdu.byte_count),
                fc_data = [];

            for (var i = 0; i < response.pdu.byte_count / 2; i += 1) {
            
                fc_data.push(dv.getUint16(i * 2));
            
            }

            return fc_data;
        
        };

        this._responseHandler[5] = function (response, offset, data) {
        
            var dv = new DataView(data, offset + 9, response.pdu.byte_count),
                fc_data = [];

            return fc_data;
        
        };

        this._responseHandler[6] = function (response, offset, data) {
        
            var dv = new DataView(data, offset + 9, response.pdu.byte_count),
                fc_data = [];

            return fc_data;
        
        };

        this._createMBAP = function (packet, id) {
        
            var dv = new DataView (packet, 0, 7);

            dv.setUint16(MBAP_TID, id);    // Transaction ID
            dv.setUint16(MBAP_PID, 0);     // Modbus Protocol ID
            dv.setUint16(MBAP_LEN, 6);     //
            dv.setUint8(MBAP_UID, 255);    // Unit Identifier

        };

        this._createNewId = function () {

            this.id = (this.id + 1) % 100000;
        
        };

        this._sendPacket = function (packet) {

            chrome.sockets.tcp.send(
                this.con.socketId, packet, function () { });

        };

        this._setCallbackHandler = function (handler, packet) {

            var that = this;

            var timeout = setTimeout(function () {

                handler.reject({ errCode: 'timeout' });
                that.fire('error', [ { 'errCode' : 'timeout' } ]);

            }, 1000);

            this.handler[this.id] = {
                'callback'      : handler,
                'requestPacket' : packet,
                'timeout'       : timeout
            };

        };

        this._readCoils = function (regNo, regCount) {
        
            var defer = $.Deferred();

            if (!this.con.socketId) {
                defer.reject();
            }

            var packet  = new ArrayBuffer(12),      // determine the length in byte
                body    = new DataView(packet, 7, 5);

            this._createMBAP(packet, this.id);

            body.setUint8(BODY_FC, READ_COILS);     // Function Code Read Coils = 1
            body.setUint16(BODY_START, regNo);      // Start Register
            body.setUint16(BODY_COUNT, regCount);   // Register Count

            var data = new DataView(packet, 0, 12);

            this._setCallbackHandler(defer, packet);

            this._createNewId();

            this._sendPacket(packet);

            return defer.promise();
        
        };

        this._readInputRegisters = function (regNo, regCount) {
       
            var defer = $.Deferred();

            if (!this.con.socketId) {
                defer.reject();
            }

            var packet  = new ArrayBuffer(12),        
                body    = new DataView(packet, 7, 5);

            this._createMBAP(packet, this.id);

            body.setUint8(BODY_FC, READ_INPUT_REGISTERS);
            body.setUint16(BODY_START, regNo);
            body.setUint16(BODY_COUNT, regCount);

            this._setCallbackHandler(defer, packet);

            this._createNewId();

            this._sendPacket(packet);

            return defer.promise();

        };

        this._writeSingleCoil = function (addr, value) {
        
            var defer = $.Deferred();

            if (!this.con.socketId) {
                defer.reject();
            }

            var packet  = new ArrayBuffer(12),
                body    = new DataView(packet, 7, 5);

            this._createMBAP(packet, this.id);

            body.setUint8(BODY_FC, WRITE_SINGLE_COIL);
            body.setUint16(BODY_START, addr);
            body.setUint16(BODY_COUNT, value?65280:0);
        
            this._setCallbackHandler(defer, packet);

            this._createNewId();

            this._sendPacket(packet);

            return defer.promise();

        };

        this._writeSingleRegister = function (regNo, value) {
        
            var defer = $.Deferred();

            if (!this.con.socketId) {
                defer.reject();
            }

            var packet  = new ArrayBuffer(12),
                body    = new DataView(packet, 7, 5);

            this._createMBAP(packet, this.id);

            body.setUint8(BODY_FC, WRITE_SINGLE_REGISTER);
            body.setUint16(BODY_START, regNo);
            body.setUint16(BODY_COUNT, value);

            this._setCallbackHandler(defer);

            this._createNewId();

            this._sendPacket(packet);

            return defer.promise();

        };

        chrome.sockets.tcp.onReceive.addListener(this._receiveListener);

    };


    ModbusClient.inherits(Events);


    ModbusClient.method('readCoils', function (regNo, regCount) {

        if (this.status === 'offline') {
            throw new Error('Client is offline.');
        }

        return this._readCoils(regNo, regCount);

    });

    ModbusClient.method('readInputRegisters', function (regNo, regCount) {

        if (this.status === 'offline') {
            throw new Error('Client is offline.');
        }

        return this._readInputRegisters(regNo, regCount);

    });

    ModbusClient.method('writeSingleCoil', function (regNo, value) {
                
        if (this.status === 'offline') {
            throw new Error('Client is offline.');
        }

        return this._writeSingleCoil(regNo, value);
    });

    ModbusClient.method('writeSingleRegister', function (regNo, value) {

        if (this.status === 'offline') {
            throw new Error('Client is offline.');
        }

        return this._writeSingleRegister(regNo, value);

    });



})();

