function RangeListTest() {


};

registerTestSuite(RangeListTest);

var proto = RangeListTest.prototype;

proto.mergeParameterCheck = function () {

    var list = new RangeList();

    expectThat(list.getList(), looksLike([]));

    list.merge(10, 0);

    expectThat(list.getList(), looksLike([]));

    list.merge(10, 10);

    expectThat(list.getList(), looksLike([]));

};

proto.merge = function () {

    var list = new RangeList();

    expectThat(list.getList(), looksLike([]));

    list.merge(10, 20);

    expectThat(list.getList(), looksLike([
        { start: 10, end: 20 }
    ]));

    list.merge(0, 5);

    expectThat(list.getList(), looksLike([
        { start: 0, end: 5 },
        { start: 10, end: 20 }
    ]));

    list.merge(25, 30);

    expectThat(list.getList(), looksLike([
        { start: 0, end: 5 },
        { start: 10, end: 20 },
        { start: 25, end: 30 }
    ]));

    list.merge(1, 4);

    expectThat(list.getList(), looksLike([
        { start: 0, end: 5 },
        { start: 10, end: 20 },
        { start: 25, end: 30 }
    ]));

    list.merge(1, 7);

    expectThat(list.getList(), looksLike([
        { start: 0, end: 7 },
        { start: 10, end: 20 },
        { start: 25, end: 30 }
    ]));

    list.merge(5, 12);

    expectThat(list.getList(), looksLike([
        { start: 0, end: 20 },
        { start: 25, end: 30 }
    ]));

    list.merge(35, 40);

    expectThat(list.getList(), looksLike([
        { start: 0, end: 20 },
        { start: 25, end: 30 },
        { start: 35, end: 40 }
    ]));

    list.merge(10, 37);

    expectThat(list.getList(), looksLike([
        { start: 0, end: 40 }
    ]));

    list.merge(41, 45);

    expectThat(list.getList(), looksLike([
        { start: 0, end: 45 }
    ]));

};
