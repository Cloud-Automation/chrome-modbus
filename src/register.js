
Register = function (client, loop, start) {

    if (!(this instanceof Register)) {
        return new Register(client, loop, start);
    }

    /*
     * States:
     *  init -> ready -> executing -> ready
     */

    StateMachine.call(this, 'ready');

    var status = {
            stateflag_1     : false,
            stateflag_2     : false,
            stateflag_3     : false,
            stateflag_4     : false,
            state           : 0,
            cmd_count       : 0,
            cmd_ex          : false,
            cmd_err         : false,
            arg             : 0
        },
        queue = [],
        cmdId = 0,
        loopListenerId;

    loop.readHoldingRegisters(start, 4);


    var updateStatus = function (inputRegisters, holdingRegisters) {

        var status_reg = holdingRegisters[start],
            status_arg = holdingRegisters[start + 1];

        var s_1     = 0x0001,
            s_2     = 0x0002,
            s_3     = 0x0004,
            s_4     = 0x0008,
            s_state = 0x07F0,
            s_cid   = 0x3800,
            s_cide  = 0x4000,
            s_cidf  = 0x8000;


        status.stateflag_1 = (status_reg & s_1) >> 0;
        status.stateflag_2 = (status_reg & s_2) >> 1;
        status.stateflag_3 = (status_reg & s_3) >> 2;
        status.stateflag_4 = (status_reg & s_4) >> 3;
        status.state       = (status_reg & s_state) >> 4;
        status.cmd_count   = (status_reg & s_cid) >> 11;
        status.cmd_ex      = (status_reg & s_cide) >> 14;
        status.cmd_err     = (status_reg & s_cidf) >> 15;
        status.arg         = status_arg;

        this.fire('update_status', [status]);

    }.bind(this);

    var flush = function () {
    
        console.log('Register', 'Flushing latest command.');

        if (queue.length === 0) {
            console.log('Register', 'Nothing to flush.');
            return;
        }

        if (this.inState('execution')) {
            console.log('Register', 'Waiting, currently in execution state.');
            return;
        }

        this.setState('execution');

        var first   = queue.shift(),
            command = first.command,
            defer   = first.deferred;
    
        cmdId = (cmdId + 1) % 8;

        var cmd         = command << 3,
            ex_flag     = 1 << 15,
            that        = this,
            cmdReg      = cmdId + cmd + ex_flag;

        console.log('Register', 'Writing to modbus server.', cmdReg);

        var promise_1, promise_2;

        if (first.param !== undefined) {
        
            console.log('Register', 'Execution sets parameter.', first.param);

            promise_1 = client.writeSingleRegister(start + 3, first.param);
        
            promise_2 = promise_1.then(client.writeSingleRegister(start + 2, cmdReg));

        } else {

            console.log('Register', 'Writing just one register.', this);

            promise_2 = client.writeSingleRegister(start + 2, cmdReg);

        }


        promise_2.fail(function (err) {
   
                console.error('Register', 'Sending command to PLC failed.', err);

                defer.reject({ errCode: 'modbusError' });

                that.setState('ready');
    
            }).then(function () {
            
                console.log('Register', 'Sending command to PLC was successfull.');

                var handler_id, timeout_id, update_count = 0;

                timeout_id = setTimeout(function () {

                    console.error('Register', 'PLC did not executed the command inside the timeframe.', update_count);

                    defer.reject({ errCode: 'timeout', update_count : update_count });

                    that.setState('ready');

                }, 5000);

                handler_id = that.on('update_status', function (status) {

                    update_count += 1;

                    if (status.cmd_count === cmdId && 
                        status.cmd_ex) { 

                        console.log('Register', 'Command executed.', status);
 
                        that.off(handler_id);
                        clearTimeout(timeout_id);

                        if (!status.cmd_err) {

                            console.log('Register', 'PLC executed command successfully.');

                            defer.resolve(status.arg);

                        } else {
     
                            console.error('Register', 'PLC responded with execution error.');              

                            defer.reject({ errCode: 'plcError' });

                        }

                        that.setState('ready');

                    }

                });

            });

    }.bind(this);


    loopListenerId = loop.on('update', updateStatus);

    this.execute = function (command, param) {

        console.log('Register', 'Queing a new command.', command, param);

        var defer = $.Deferred();

        queue.push({
            'deferred'  : defer,
            'command'   : command,
            'param'     : param
        });

        if (this.inState('ready')) {
            flush();
        }

        return defer.promise();

    };

    this.on('state_changed', function (oldState, newState) {
   
        console.log('Register', 'State changed from', oldState, 'to', newState);

        if (newState === 'ready') {

            flush();
        
        }
    
    });
 
    this.getStatus = function () {

        return status;

    };

    this.close = function () {

        loop.off(LoopListenerId);

        return this;

    };
           

};

Register.inherits(StateMachine);


