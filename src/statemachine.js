StateMachine = function (initState) {

    if (!(this instanceof StateMachine)) {
        return new StateMachine(initState);
    }

    Events.call(this);

    this._state = initState;

};

StateMachine.inherits(Events);

StateMachine.method('inState', function (state) {

    return this._state === state;

});

StateMachine.method('getState', function () {

    return this._state;

});

StateMachine.method('setState', function (newState) {

    var oldState = this._state;

    this._state = newState;

    this.fire('state_changed', [oldState, newState]);
    
    return this;

});
