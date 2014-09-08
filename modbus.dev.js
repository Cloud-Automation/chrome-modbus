(function () {

    Function.prototype.method = function (name, func) {
    
        this.prototype[name] = func;
        return this;
    
    };

    Function.method('inherits', function (superCtor) {
 
        this.super_ = superCtor;
        this.prototype = Object.create(superCtor.prototype, {
            constructor: {
                value: this,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });

        return this;
    });

})();
(function () {

    Events = function () {
   
        this._cbList = { };

    };

    Events.method('fire', function (name, args) {
    
        if (!this._cbList[name]) {
        
            return;

        }
 
        for (var i in this._cbList[name]) {
            
            this._cbList[name][i].apply(null, args);
        
        }
    
    });

    Events.method('fireLater', function (name) {
    
        var that = this;

        return function () {
        
            that.fire(name, arguments);

        };

    });

    Events.method('on', function (name, func) {
 
        if (!this._cbList[name]) {
            this._cbList[name] = [];
        }

        this._cbList[name].push(func);

        return { name: name, index: this._cbList[name].length-1 };
    
    });

    Events.method('off', function (id) {

        this._cbList[id.name].splice(id.index);

        return this;

    });

})();
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
            
            if (!this._pQueue) {
                this._pQueue = [];
            }

            if (arguments.length > 0) {
                this._pQueue.push(packet);
            }


            if (this._isWaiting) {
                return;
            }

            if (this._pQueue.length === 0) {
                return;
            }

            this._isWaiting = true;

            var that = this;

            chrome.sockets.tcp.send(
                this.con.socketId, this._pQueue.shift(), function () {
       
                that._isWaiting = false;

                that._sendPacket();
            
            });

        };

        this._setCallbackHandler = function (handler, packet, id) {

            var that = this;

            var timeout = setTimeout(function () {

                handler.reject({ errCode: 'timeout' });
                //that.fire('error', [ { 'errCode' : 'timeout' , 'data': packet } ]);

            }, 10000);

            this.handler[id] = {
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

            if (!this.con.socketId) {
                defer.reject();
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

            if (!this.con.socketId) {
                defer.reject();
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

            if (!this.con.socketId) {
                defer.reject();
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

(function () {

    ModbusPoll = function (client, duration) {
    
        if (!(this instanceof ModbusPoll)) {
            return new ModbusPoll(client, duration);
        }

        Events.call(this);

        if (!client) {
            throw new Error('No Modbus client defined!');
        }

        this._client = client;
        this._duration = duration;

        this._handler = { };

        this._start = false;
        this._counter = -1;
        this._id = 0;
        this._exTime = 10000000;


        var that = this;

        this._client.on('error', function () {
        
            that.fire('error', arguments);

        });

        this._confirmTermination = function () {
        
            if (that._counter === -1) {
                return;
            }

            for (var i in this._handler) {
            
                if (!this._handler[i].executed) {

                    this.stop();
                    this.fire('error', [{ 'errCode': 'loopOutOfSync' }]);
                    return;
                
                }

            }

        };

        this._resetExecutionFlags = function () {
        
            for (var i in this._handler) {
            
                this._handler[i].executed = false;

            }

        };

        this._callHandlers = function () {
       
            for (var i in this._handler) {
            
                this._handler[i].func();

            }
        
        };

        if (!this._duration) {
        
            this._freeLoop = function () {
            
                if (!that._start) {
                    return;
                }

                // start timer
                var start           = new Date().getTime(),
                    cntr            = that._id,
                    allHandler      = [],
                    finishHandler   = function () {
                        cntr -= 1;

                        if (cntr === 0) {
                            var end = new Date().getTime();

                            that._exTime = end - start;

                            // remove handler
                            for (var j in allHandler) {
                                that.off(allHandler[j]);
                            }

                            that._freeLoop();
                        }
                    };



                for (var i in that._handler) {
                    
                    var h = that.on(i, finishHandler);

                    allHandler.push(h); 

                }

                that._callHandlers();

            
            };

        } else {

            this.iid = setInterval(function () {
          
                if (!that._start) {
                    return;
                }

                that._confirmTermination();
                that._resetExecutionFlags();
                that._callHandlers();

                that._counter = (that._counter + 1) % 1000;

            }, this._duration);

        }
     
    };

    ModbusPoll.inherits(Events);

    ModbusPoll.method('readCoils', function (start, count) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that._client.readCoils(start, count).then(function () {

                    that._handler[id].executed = true;
                    that.fire(id, arguments);

                }).fail(function () {
                   
                    that.stop(); 
                    that.fire('error', [
                        { 
                            'errCode' : id, 
                            'args'    : arguments 
                        }
                    ]);

                });

            };

        this._handler[id] = { };
        this._handler[id].func = handler;
        this._handler[id].executed = false;

        return this._id++;
    
    });

    ModbusPoll.method('readInputRegisters', function (start, count) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that._client.readInputRegisters(start, count).then(function () {

                    that._handler[id].executed = true;
                    that.fire(id, arguments); 

                }).fail(function () {
                   
                    that.stop(); 
                    that.fire('error', [
                        { 
                            'errCode' : id, 
                            'args'    : arguments 
                        }
                    ]);

                });

            };

        this._handler[id]           = { };
        this._handler[id].func      = handler;
        this._handler[id].executed  = false;

        return this._id++;
    
    });

    ModbusPoll.method('writeSingleCoil', function (reg, value) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that._client.writeSingleCoil(reg, value).then(function () {

                    that._handler[id].executed = true;
                    that.fire(id, arguments); 

                }).fail(function () {
                   
                    that.stop(); 
                    that.fire('error', [
                        { 
                            'errCode' : id, 
                            'args'    : arguments 
                        }
                    ]);

                });

            };

        this._handler[id] = { };
        this._handler[id].func = handler;
        this._handler[id].executed = false;

        return this._id++;
    
    });

    ModbusPoll.method('writeSingleRegister', function (reg, value) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that._client.writeSingleRegister(reg, value).then(function () {

                    that._handler[id].executed = true;
                    that.fire(id, arguments); 

                }).fail(function () {
                   
                    that.stop(); 
                    that.fire('error', [
                        { 
                            'errCode' : id, 
                            'args'    : arguments 
                        }
                    ]);

                });

            };

        this._handler[id] = { };
        this._handler[id].func = handler;
        this._handler[id].executed = false;

        return this._id++;
    
    });

    ModbusPoll.method('remove', function (id) {
    
        if (!this._handler[id]) {
            return false;
        }

        delete this._handler[id];

        return true;
    
    });

    ModbusPoll.method('start', function () {

        this._counter = -1;
        this._start = true; 

        if (!this._duration) {
            this._freeLoop(); 
        }

    
    });

    ModbusPoll.method('stop', function () {
    
        this._start = false;
    
    });


})();
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
