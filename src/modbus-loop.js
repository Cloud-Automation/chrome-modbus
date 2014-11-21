//= include range-list.js

ModbusLoop = function (client, duration) {

    if (!(this instanceof ModbusLoop)) {
        return new ModbusLoop(client, duration);
    }

    StateMachine.call(this, 'stop');

    var readInputRegistersList    = new RangeList(),
        readHoldingRegistersList  = new RangeList(),
        readCoilList              = new RangeList(),
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
 
        var promisses = [], cur, promise, inputsList, retPromise, lists, min, start, end;

        inputsList = readInputRegistersList.getList();
 
        for (var i = 0; i < inputsList.length; i += 1) {
   
            cur = inputsList[i];

            start   = cur.start;
            min     = 0;
            end     = 0;

            // restricting the size of a register call to 120, otherwise
            // there can be modbus errors due to too many requests

            do {

                start   = start + min;
                min     = Math.min(start + 120, cur.end - start);
                end     = start + min;

                promise = client.readInputRegisters(start, min);

                promisses.push(promise);


            } while (end !== cur.end);



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

            start   = cur.start;
            min     = 0;
            end     = 0;

            // restricting the size of a register call to 120, otherwise
            // there can be modbus errors due to too many requests


            do {

                start   = start + min;
                min     = Math.min(start + 120, cur.end - start);
                end     = start + min;

                promise = client.readHoldingRegisters(start, min);

                promisses.push(promise);


            } while (end !== cur.end);


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


