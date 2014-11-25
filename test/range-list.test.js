var RangeList = require('../src/range-list.js').RangeList,
    assert = require('assert');

describe('RangeList Tests.', function () {
    
    
    it('Should merge parameter', function () {

        var list = new RangeList();

        assert.deepEqual(list.getList(), []);

        list.merge(10, 0);

        assert.deepEqual(list.getList(), []);

        list.merge(10, 10);

        assert.deepEqual(list.getList(), []);

    });

    it ('Should merge', function () {

        var list = new RangeList();

        assert.deepEqual(list.getList(), []);

        list.merge(10, 20);

        assert.deepEqual(list.getList(), [
            { start: 10, end: 20 }
        ]);

        list.merge(0, 5);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 5 },
            { start: 10, end: 20 }
        ]);

        list.merge(25, 30);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 5 },
            { start: 10, end: 20 },
            { start: 25, end: 30 }
        ]);

        list.merge(1, 4);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 5 },
            { start: 10, end: 20 },
            { start: 25, end: 30 }
        ]);

        list.merge(1, 7);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 7 },
            { start: 10, end: 20 },
            { start: 25, end: 30 }
        ]);

        list.merge(5, 12);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 20 },
            { start: 25, end: 30 }
        ]);

        list.merge(35, 40);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 20 },
            { start: 25, end: 30 },
            { start: 35, end: 40 }
        ]);

        list.merge(10, 37);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 40 }
        ]);

        list.merge(41, 45);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 45 }
        ]);

    });

    it('Should optimize', function () {

        var list = new RangeList(100);

        list.merge(0, 100);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 100 }
        ]);

        list.merge(50, 150);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 100 }, { start: 100, end: 150 }
        ]);

        list.merge(10, 120);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 100 }, { start: 100, end: 150 }
        ]);

        list.merge(0, 401);

        assert.deepEqual(list.getList(), [
            { start: 0, end: 100 }, 
            { start: 100, end: 200 }, 
            { start: 200, end: 300 }, 
            { start: 300, end: 400 }, 
            { start: 400, end: 401 }         
        ]);


    });

});
