(function () {

    ArrayBufferMatch = function (testValue, length) {
   
        var abToString = function (buffer, length) {

            var dv = new DataView(buffer, 0, length);

            var s = '';
            for (var i = 0; i < 12; i += 1) {
                s += dv.getUint8(i).toString(16) + ' ';
            }

            return s;

        };     
        
        return sinon.match(function (value) {
   
            var o = abToString(testValue, length),
                t = abToString(value, length);

            console.log(o, t);


            return o == t;
    

        }, 'ArrayBuffer match.');
    };

})();
