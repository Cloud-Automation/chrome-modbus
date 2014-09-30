console = {
    log: function () {
        var s = '';
        for (var i in arguments) {
            s += arguments[i] + ' ';
        }

        gjstest.log(s);
    }
};

setTimeout = function (cb, ms) {

    cb();

};
