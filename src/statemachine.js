//= include events.js

var StateMachine = function (initState) {

    if (!(this instanceof StateMachine)) {
        return new StateMachine(initState);
    }

    Events.call(this);

    var state = initState;

    this.inState = function (newState) {

        return state === newState;

    };

    this.getState = function () {

        return state;

    };

    this.setState = function (newState) {

        var oldState = state;

        state = newState;

        this.fire('state_changed', [oldState, newState]);
        
        return this;

    };

};

StateMachine.inherits(Events);


