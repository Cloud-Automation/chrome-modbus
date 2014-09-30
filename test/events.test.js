function EventsTest() {  

    this.eventHandler = createMockFunction();

}

registerTestSuite(EventsTest);


EventsTest.prototype.fireOneEvent = function () {

    var subj = new Events();

    expectCall(this.eventHandler)().times(1);

    subj.on('test_event', this.eventHandler);
    subj.fire('test_event');

};

EventsTest.prototype.fireTwoEvents = function () {

    var subj = new Events();

    expectCall(this.eventHandler)().times(2);

    subj.on('test_event', this.eventHandler);
    subj.fire('test_event');
    subj.fire('test_event');
    subj.fire('some_event');

};

EventsTest.prototype.fireOneEventWithParameters = function () {

    var subj = new Events();

    expectCall(this.eventHandler)(1, 2, 3);

    subj.on('test_event', this.eventHandler);
    subj.fire('test_event', [1, 2, 3]);

};

EventsTest.prototype.fireTwoEventsWithParameters = function () {

    var subj = new Events();

    expectCall(this.eventHandler)(1, 2, 3);
    expectCall(this.eventHandler)(4, 5, 6);

    subj.on('test_event', this.eventHandler);
    subj.fire('test_event', [1, 2, 3]);
    subj.fire('test_event', [4, 5, 6]);

};

EventsTest.prototype.fireEventLater = function () {

    var subj = new Events();

    expectCall(this.eventHandler)();

    subj.on('test_event', this.eventHandler);
    subj.fireLater('test_event')();

};

EventsTest.prototype.fireEventLaterWithArgs = function () {

    var subj = new Events();

    expectCall(this.eventHandler)(1, 2, 3, 4, 5, 6);

    subj.on('test_event', this.eventHandler);
    subj.fireLater('test_event', [1, 2, 3])(4, 5, 6);

};

EventsTest.prototype.unsubscribeEventHandler = function () {

    var subj = new Events(),
        hand = subj.on('test_event', this.eventHandler);

    expectCall(this.eventHandler)().times(1);

    subj.fire('test_event');
    subj.off(hand);
    subj.fire('test_event');

};
