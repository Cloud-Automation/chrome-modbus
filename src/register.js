
var register_debug_id = 0;

Register = function (client, loop, start) {

    if (!(this instanceof Register)) {
        return new Register(client, loop, start);
    }

    /*
     * States:
     *  init -> ready -> executing -> ready
     */

    StateMachine.call(this, 'init');

    var rd_id = register_debug_id++;

    console.log('Register',rd_id, 'Creating new instance.');

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
        loopListenerId,
        queue = [],
        cmdId = 0;

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

        if (this.inState('init')) {

            console.log('Register', rd_id, 'Initial command counter is', status.cmd_count);
            cmdId = status.cmd_count;

            this.setState('ready');

        }

        this.fire('update_status', [ status ]);

    }.bind(this);

    var flush = function () {
    
        console.log('Register',rd_id, 'Flushing latest command.');

        if (queue.length === 0) {

            console.log('Register',rd_id, 'Nothing to flush.');
            return;
        
        }

        if (!this.inState('ready')) {

            console.log('Register',rd_id, 'Waiting, currently not in the ready state.', this.getState());
            return;

        }

        this.setState('execution');

        var first       = queue.shift(),
            command     = first.command,
            defer       = first.deferred;
    
        cmdId = (cmdId + 1) % 8;

        var cmd         = command << 3,
            ex_flag     = 1 << 15,
            cmdReg      = cmdId + cmd + ex_flag;

        console.log('Register',rd_id, 'Writing to modbus server.', cmdReg);

        var promisses = [];

        if (first.param !== undefined) {
        
            console.log('Register',rd_id, 'Execution sets parameter.', first.param);

            promisses.push(client.writeSingleRegister(start + 3, first.param));
        
        } 

        promisses.push(client.writeSingleRegister(start + 2, cmdReg));


        $.when.apply(this, promisses).fail(function (err) {
   
                console.error('Register',rd_id, 'Sending command to PLC failed.', err);

                defer.reject({ 
                    errCode: 'modbusError' 
                });

                this.setState('ready');
    
            }.bind(this)).then(function () {
            
                console.log('Register',rd_id, 'Sending command to PLC was successfull.');

                var handler_id, timeout_id, update_count = 0;

                timeout_id = setTimeout(function () {

                    console.error('Register',rd_id, 'PLC did not executed the command inside the timeframe.', update_count, status);

                    defer.reject({ 
                        errCode         : 'timeout', 
                        update_count    : update_count 
                    });

                    this.setState('ready');

                }.bind(this), 5000);

                handler_id = this.on('update_status', function (status) {

                    update_count += 1;

                    if (status.cmd_count === cmdId && status.cmd_ex) { 

                        console.log('Register',rd_id, 'Command executed.', status);
 
                        this.off(handler_id);
                        clearTimeout(timeout_id);

                        if (!status.cmd_err) {

                            console.log('Register',rd_id, 'PLC executed command successfully.');

                            defer.resolve(status.arg);

                        } else {
     
                            console.error('Register',rd_id, 'PLC responded with execution error.');              

                            defer.reject({ errCode: 'plcError' });

                        }

                        this.setState('ready');

                    }

                }.bind(this));

            }.bind(this));

    }.bind(this);


    loopListenerId = loop.on('update', updateStatus);

    this.execute = function (command, param) {

        console.log('Register',rd_id, 'Queing a new command.', command, param);

        var defer = $.Deferred();

        queue.push({
            'deferred'  : defer,
            'command'   : command,
            'param'     : param
        });

        flush();

        return defer.promise();

    };

    this.on('state_changed', function (oldState, newState) {
   
        console.log('Register',rd_id, 'State changed from', oldState, 'to', newState);

        if (newState === 'ready') {

            flush();
        
        }
    
    });
 
    this.getStatus = function () {

        return status;

    };

    this.getAddress = function () {
    
        return start;
    
    };

    this.close = function () {

        loop.off(loopListenerId);

        return this;

    };
           

};

Register.inherits(StateMachine);


