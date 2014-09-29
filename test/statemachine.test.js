function StateMachineTest() {

};

registerTestSuite(StateMachineTest);

var proto = StateMachineTest.prototype;

proto.isInInitialState = function () {

    var sm = new StateMachine('start');

    expectThat(sm.inState('start'), equals(true));
    expectThat(sm.getState(), equals('start'));

};

proto.switchState = function () {

    var sm = new StateMachine('start'),
        mock = createMockFunction();

    sm.on('state_changed', mock);

    expectCall(mock)('start', 'stop').times(1);

    sm.setState('stop');

    expectThat(sm.inState('stop'), equals(true));
    expectThat(sm.getState(), equals('stop'));



};
