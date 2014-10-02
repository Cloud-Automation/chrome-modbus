ModbusLoop = function (client, duration) {

    if (!(this instanceof ModbusLoop)) {
        return new ModbusLoop(client, duration);
    }

    StateMachine.call(this, 'stop');

    this._client                = client;

    this._readInputRegisterList = new RangeList();
    this._readCoilList          = new RangeList();

    this._inputRegisters        = [];

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

    this._executeLoop = function () {

        var list = [], cur, promise, inputsList;

        if (!this.inState('running')) {
            return;
        }

        inputsList = this._readInputRegisterList.getList();
 
        for (var i = 0; i < inputsList.length; i += 1) {
   
            cur = inputsList[i];

            promise = this._client.readInputRegisters(cur.start, cur.end - cur.start);

            list.push(promise);

        }

        $.when.apply(this, list).then(function () {
     
            var args;

            if (list.length === 1) {
                args = [arguments];
            } else {
                args = arguments;
            }

            for (var i in args) {
            
                this._updateInputRegisters(args[i][1].start, args[i][0]);
            
            }

            this.fire('update', [ this._inputRegisters ]);

            this._executeLoop();

        
        }.bind(this)).fail(function () {
        
            this.setState('stop');
        
        }.bind(this));
    
    }
}

ModbusLoop.inherits(StateMachine);

ModbusLoop.method('readInputRegisters', function (start, count) {

    var defer = $.Deferred();

    // put the start and end into the list
    this._readInputRegisterList.merge(start, start + count);

    return defer.promise();

});

ModbusLoop.method('start', function () {

    console.log('ModbusLoop', 'Starting loop.');

    this.setState('running');

    this._executeLoop();

});

ModbusLoop.method('stop', function () {

    this.setState('stop');

});

/*
client = new ModbusClient();

loop = new Loop(); // free running

loop.readInputRegisters(10, 4).then(function (data) {

});

loop.readInputRegisters(14, 4).then(function (data) {

});

// combine those

loop.start();
*/
