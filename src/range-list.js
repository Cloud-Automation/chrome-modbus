var RangeList = function () {

    if (!(this instanceof RangeList)) {
        return new RangeList();
    }

    /*
     * Entries look like { start: x, end: y, items: [] }
     */

    var list = [];

    var shrink = function () {
 
        if (list.length === 1 ) {
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

    this.getList = function () {

        return list;

    };

};


