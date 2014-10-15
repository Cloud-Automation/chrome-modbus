ModbusLoop = function (client, duration) {

    if (!(this instanceof ModbusLoop)) {
        return new ModbusLoop(client, duration);
    }

    StateMachine.call(this, 'stop');

    this._client                    = client;

    this._readInputRegistersList    = new RangeList();
    this._readHoldingRegistersList  = new RangeList();
    this._readCoilList              = new RangeList();

    this._inputRegisters            = [];
    this._holdingRegisters          = [];
    this._coils                     = [];

    this._client.on('disconnected', function () {
    
        this.setState('stop');

    }.bind(this));

    this._client.on('error', function () {
    
        this.setState('stop');
    
    }.bind(this))

    this._updateInputRegisters = function (start, data) {
    
        for (var i = 0; i < data.length; i += 1) {

            this._inputRegisters[start + i] = data[i] ;           
                    
        }

    };

    this._updateHoldingRegisters = function (start, data) {
    
        for (var i = 0; i < data.length; i += 1) {

            this._holdingRegisters[start + i] = data[i] ;           
                    
        }

    };

    this._executeInputRegistersLoop = function () {
 
        var promisses = [], cur, promise, inputsList, retPromise;

        inputsList = this._readInputRegistersList.getList();
 
        for (var i = 0; i < inputsList.length; i += 1) {
   
            cur = inputsList[i];

            promise = this._client.readInputRegisters(cur.start, cur.end - cur.start);

            promisses.push(promise);

        }

        retPromise = $.when.apply(this, promisses).then(function () {
     
            var args;

            if (promisses.length === 1) {
                args = [arguments];
            } else {
                args = arguments;
            }

            for (var i in args) {
            
                this._updateInputRegisters(args[i][1].start, args[i][0]);
            
            }
        
        }.bind(this));

        return retPromise;
    
    };
   
    this._executeHoldingRegistersLoop = function () {
 
        var promisses = [], cur, promise, inputsList, retPromise;

        inputsList = this._readHoldingRegistersList.getList();
 
        for (var i = 0; i < inputsList.length; i += 1) {
   
            cur = inputsList[i];

            promise = this._client.readHoldingRegisters(cur.start, cur.end - cur.start);

            promisses.push(promise);

        }

        retPromise = $.when.apply(this, promisses).then(function () {
     
            var args;

            if (promisses.length === 1) {
                args = [arguments];
            } else {
                args = arguments;
            }

            for (var i in args) {
            
                this._updateHoldingRegisters(args[i][1].start, args[i][0]);
            
            }
        
        }.bind(this));
    
        return retPromise;
    
    };
 
    this._executeLoop = function () {

        if (!this.inState('running')) {
            return;
        }

        var loop_1 = this._executeInputRegistersLoop(),
            loop_2 = this._executeHoldingRegistersLoop();

        $.when.apply(this, [ loop_1, loop_2 ]).then(function () {
 
                this.fire('update', [ this._inputRegisters, this._holdingRegisters ]);
 
                this._executeLoop();
          
            }.bind(this)).fail(function () {
            
                this.setState('stop');

            }.bind(this));

    };

    this.on('state_changed', function (oldState, newState) {
    
        console.log('ModbusLoop', 'Switching from State', oldState, ' to State', newState);

    });
}

ModbusLoop.inherits(StateMachine);

ModbusLoop.method('readInputRegisters', function (start, count) {

    // put the start and end into the list
    this._readInputRegistersList.merge(start, start + count);

    return this;

});

ModbusLoop.method('readHoldingRegisters', function (start, count) {

    this._readHoldingRegistersList.merge(start, start + count);

    return this;

});

ModbusLoop.method('start', function () {

    console.log('ModbusLoop', 'Starting loop.');

    this.setState('running');

    this._executeLoop();

});

ModbusLoop.method('stop', function () {

    console.log('ModbusLoop', 'Stopping loop.');

    this.setState('stop');

});
