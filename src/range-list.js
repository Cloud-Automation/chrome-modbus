var RangeList = function (max) {

    if (!(this instanceof RangeList)) {
        return new RangeList(max);
    }

    /*
     * Entries look like { start: x, end: y, items: [] }
     */

    var list = [];

    var shrink = function () {
 
        if (list.length === 1 ) {
            optimize();
            return this;
        }

        var next, j = 0;

        while (j < list.length - 1) {

            cur = list[j];
            next = list[j + 1];

            if (cur.end >= next.start - 1 ) {
            
                cur.end = Math.max(cur.end, next.end);

                list.splice(j + 1, 1);
           
                continue;

            }

            j += 1;

        }

        optimize();

    }.bind(this);

    this.merge = function (start, end) {

        if (end <= start) {
            return this;
        }

        if (list.length === 0) {

            list.push({ start: start, end: end });
            return this;

        }

        for (var i in list) {
        
            cur = list[i];

            // neuer start ist größer als element ende
            // => füge am ender der liste ein
            
            if (cur.start > end) {
            
                list.splice(i, 0, { start: start, end: end });

                shrink();

                return this;

            }

            if (cur.start >= start && cur.end > start) {
                
                if (cur.end < end) {

                    cur.start   = start;
                    cur.end     = start + end;

                    shrink();

                    return this;

                }

                if (cur.end >= end) {
            
                    cur.start   = start;
                    cur.end     = cur.end;

                    shrink();

                    return this;
                
                }

            }

            if (cur.start < start && cur.end > start) {
            
                if (cur.end >= end) {

                    shrink();

                    return this;      
                
                }

                if (cur.end < end) {
                
                    cur.end     = end;

                    shrink();

                    return this;

                }

            }
     
        }

        list.push({ start: start, end: end });

        shrink();
       
        return this;

    };

    var optimize = function () {

        if (!max) {
            return;
        }

        var l = [], start, end;
    
        for (var i = 0; i < list.length; i += 1) {
        
            if (list[i].end - list[i].start > max) {

                list.splice(i + 1, 0, { start: list[i].start + max, end: list[i].end });

                list[i].end = list[i].start + max;


            }
                
        }

    }.bind(this);

    this.getList = function () {

        return list;

    };

};

if (typeof exports !== 'undefined') {
    exports.RangeList = RangeList;
}
