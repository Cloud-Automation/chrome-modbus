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

looksLike = function (current) {

    var desc = 'compares two range list for their elements',
        ndesc = 'the range lists do not match';

    return new gjstest.Matcher(
        desc,
        ndesc,
        function (expected) {
        
            var le, lc, match = true;

            if (expected instanceof RangeList) {
                le = expected.getList();
            } else {
                le = expected;
            }

            if (current instanceof RangeList) {
                lc = current.getList();
            } else {
                lc = current;
            }

            if (le.length !== lc.length) {
                return "RangeList Sizes doesn't match.";
            }

            for (var i = 0; i < le.length; i += 1) {

                if (lc[i].start !== le[i].start) {
                    return "current[" + i + "] === " + lc[i].start + " !== " + le[i].start + " === expected[" + i + "]"
                }

                if (lc[i].end !== le[i].end) {
                    return "current[" + i + "] === " + lc[i].end + " !== " + le[i].end + " === expected[" + i + "]"
                }

            }

            return true;


        
        }
    )

};
