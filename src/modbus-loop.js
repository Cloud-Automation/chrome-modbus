//= include range-list.js

ModbusLoop = function (client, duration) {

    if (!(this instanceof ModbusLoop)) {
        return new ModbusLoop(client, duration);
    }

    StateMachine.call(this, 'stop');

    var readInputRegistersList    = new RangeList(100),
        readHoldingRegistersList  = new RangeList(100),
        readCoilList              = new RangeList(100),
        inputRegisters            = [],
        holdingRegisters          = [],
        coils                     = [];

    client.on('disconnected', function () {
    
        this.setState('stop');

    }.bind(this));

    client.on('error', function () {
    
        this.setState('stop');
    
    }.bind(this));

    var updateInputRegisters = function (start, data) {
    
        for (var i = 0; i < data.length; i += 1) {

            inputRegisters[start + i] = data[i] ;           
                    
        }

    }.bind(this);

    var updateHoldingRegisters = function (start, data) {
    
        for (var i = 0; i < data.length; i += 1) {

            holdingRegisters[start + i] = data[i] ;           
                    
        }

    }.bind(this);

    var executeInputRegistersLoop = function () {
 
        var promisses = [], cur, promise, inputsList, retPromise, lists;

        inputsList = readInputRegistersList.getList();
 
        for (var i = 0; i < inputsList.length; i += 1) {
   
            cur = inputsList[i];

            promise = client.readInputRegisters(cur.start, cur.end - cur.start);

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
            
                updateInputRegisters(args[i][1].getStart(), args[i][0]);
            
            }
        
        }.bind(this));

        return retPromise;
    
    }.bind(this);
   
    var executeHoldingRegistersLoop = function () {
 
        var promisses = [], cur, promise, inputsList, retPromise;

        inputsList = readHoldingRegistersList.getList();
 
        for (var i = 0; i < inputsList.length; i += 1) {
   
            cur = inputsList[i];

            promise = client.readHoldingRegisters(cur.start, cur.end - cur.start);

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
           
                updateHoldingRegisters(args[i][1].getStart(), args[i][0]);
            
            }

        }.bind(this));
    
        return retPromise;
    
    }.bind(this);
 
    var executeLoop = function () {

        if (!this.inState('running')) {
            return;
        }

        var len_1   = readInputRegistersList.getList().length,
            len_2   = readHoldingRegistersList.getList().length,
            len     = len_1 + len_2;

        if (len === 0) {
        
            setTimeout(executeLoop.bind(this), 1000);
            return;

        }

        var loop_1 = executeInputRegistersLoop(),
            loop_2 = executeHoldingRegistersLoop();

        $.when.apply(this, [ loop_1, loop_2 ]).then(function () {
 
                this.fire('update', [ inputRegisters, holdingRegisters ]);
 
                executeLoop();
          
            }.bind(this)).fail(function () {

                console.error('ModbusLoop', 'Error occured, stopping loop.', arguments);

                this.setState('stop');

            }.bind(this));

    }.bind(this);

    this.readInputRegisters = function (start, count) {

        // put the start and end into the list
        readInputRegistersList.merge(start, start + count);

        return this;

    };

    this.readHoldingRegisters = function (start, count) {

        readHoldingRegistersList.merge(start, start + count);

        return this;

    };

    this.start = function () {

        console.log('ModbusLoop', 'Starting loop.');

        this.setState('running');

        executeLoop();

    };

    this.stop = function () {

        console.log('ModbusLoop', 'Stopping loop.');

        this.setState('stop');

    };
};

ModbusLoop.inherits(StateMachine);


