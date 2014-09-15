(function () {

    ModbusLoop = function (client, duration) {
    
        if (!(this instanceof ModbusLoop)) {
            return new ModbusLoop(client, duration);
        }

        Events.call(this);

        if (!client) {
            throw new Error('No Modbus client defined!');
        }

        this._client    = client;
        this._duration  = duration;

        this._handler   = { };

        this._start     = false;
        this._counter   = -1;
        this._id        = 0;
        this._exTime    = 10000000;


        this._client.on('error', function () {
        
            this.fire('error', arguments);

        });

        this._confirmTermination = function () {
        
            if (this._counter === -1) {
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

        var that = this;

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

    ModbusLoop.inherits(Events);

    ModbusLoop.method('readCoils', function (start, count) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that._client.readCoils(start, count).then(function (data) {

                    that._handler[id].executed = true;
                    that.fire(id, data);

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

    ModbusLoop.method('readInputRegisters', function (start, count) {

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

    ModbusLoop.method('writeSingleCoil', function (reg, value) {

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

    ModbusLoop.method('writeSingleRegister', function (reg, value) {

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

    ModbusLoop.method('createRegister', function (cls, startReg) {
   

        console.log('Create Single Command/Status Register.');

        var reg = new cls(this._client, startReg),
            id  = this.readInputRegisters(startReg, 2); 

        this.on(id, function (data) {
        
            reg.update_status(data[0], data[1]);
        
        });

        return reg;
    
    });

    ModbusLoop.method('createMultipleRegisters', function (clsses, startReg, count) {

        console.log('Create multiple Command/Status Register.');

        var ret = [], j = 0, id;

        for (var i = 0; i < count; i += 1) {
        
            ret.push(new clsses[j](this._client, startReg + (i * 4)));
        
            if (j < clsses.length - 1) {
                j += 1;
            }

        }

        id = this.readInputRegisters(startReg, count * 4);

        this.on(id, function (data) {
        
            for (var k = 0; k < count; k += 1) {
            
                ret[k].update_status(data[k * 4], data[k * 4 + 1]);

            }
        
        });

        return ret;
    
    });

    ModbusLoop.method('remove', function (id) {
    
        if (!this._handler[id]) {
            return false;
        }

        delete this._handler[id];

        return true;
    
    });

    ModbusLoop.method('start', function () {

        this._counter = -1;
        this._start = true; 

        if (!this._duration) {
            this._freeLoop(); 
        }

    
    });

    ModbusLoop.method('stop', function () {
    
        this._start = false;
    
    });


})();
