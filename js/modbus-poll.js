(function () {

    ModbusPoll = function (client, duration) {
    
        if (!(this instanceof ModbusClient)) {
            return new ModbusClient(con, sockets);
        }

        this._client = client;
        this._duration = duration;

        this._handler = { };

        this._start = false;
        this._counter = -1;

        var that = this;

        this._confirmTermination = function () {
        
            if (this._counter === -1) {
                return;
            }

            for (var i in this._handler) {
            
                if (!this._handler[i].executed) {

                    this.stop();
                    this.fire('error', { 'errCode': 'exectionTimeout' });
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

        this.iid = setInterval(function () {
      
            if (!start) {
                return;
            }

            that._confirmTermination();
            that._resetExecutionFlags();
            that._callHandlers();

            that._counter = (that._counter + 1) % 1000;

        }, duration);

        Events.call(this);
     
    };

    ModbusPoll.inherits(Events);

    ModbusPoll.method('readCoils', function (start, count) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that.client.readCoils(start, count).then(function () {

                    that.fire(id, arguments); 

                }).fail(function () {
                    
                    that.fire('error', [
                        { 
                            'errCode' : id, 
                            'args'    : arguments 
                        }
                    ]);

                });

            };

        this._handler[id].func = handler;
        this._handler[id].executed = false;

        return this._id++;
    
    });

    ModbusPoll.method('readInputRegisters', function (start, count) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that.client.readInputRegisters(start, count).then(function () {

                    that.fire(id, arguments); 

                }).fail(function () {
                    
                    that.fire('error', [
                        { 
                            'errCode' : id, 
                            'args'    : arguments 
                        }
                    ]);

                });

            };

        this._handler[id] = handler;

        return this._id++;
    
    });

    ModbusPoll.method('writeSingleCoil', function (reg, value) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that.client.writeSingleCoil(reg, value).then(function () {

                    that.fire(id, arguments); 

                }).fail(function () {
                    
                    that.fire('error', [
                        { 
                            'errCode' : id, 
                            'args'    : arguments 
                        }
                    ]);

                });

            };

        this._handler[id] = handler;

        return this._id++;
    
    });

    ModbusPoll.method('writeSingleRegister', function (reg, value) {

        var that    = this,
            id      = this._id,
            handler = function () {
            
                that.client.writeSingleRegister(reg, value).then(function () {

                    that.fire(id, arguments); 

                }).fail(function () {
                    
                    that.fire('error', [
                        { 
                            'errCode' : id, 
                            'args'    : arguments 
                        }
                    ]);

                });

            };

        this._handler[id] = handler;

        return this._id++;
    
    });

    ModbusPoll.method('start', function () {

        this._counter = -1;
        this._start = true; 

    
    });

    ModbusPoll.method('stop', function () {
    
        this._start = false;
    
    });


})();
