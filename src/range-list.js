var RangeList = function () {

    if (!(this instanceof RangeList)) {
        return new RangeList();
    }

    /*
     * Entries look like { start: x, end: y, items: [] }
     */

    this._list = [];

    this._shrink = function () {
 
        if (this._list.length === 1 ) {
            return this;
        }

        var next, j = 0;

        while (j < this._list.length - 1) {

            cur = this._list[j];
            next = this._list[j + 1];

            if (cur.end >= next.start - 1 ) {
            
                cur.end = Math.max(cur.end, next.end);

                this._list.splice(j + 1, 1);
           
                continue;

            }

            j += 1;

        }
    
    };

};

RangeList.method('merge', function (start, end) {

    if (end <= start) {
        return this;
    }

    if (this._list.length === 0) {

        this._list.push({ start: start, end: end });
        return this;

    }

    for (var i in this._list) {
    
        cur = this._list[i];

        if (cur.start > end) {
        
            this._list.splice(i, 0, { start: start, end: end });
            this._shrink();

            return this;

        }

        if (cur.start >= start && cur.end > start) {
            
            if (cur.end < end) {

                cur.start   = start;
                cur.end     = start + end;

                this._shrink();

                return this;

            }

            if (cur.end >= end) {
        
                cur.start   = start;
                cur.end     = cur.end;

                this._shrink();

                return this;
            
            }

        }

        if (cur.start < start && cur.end > start) {
        
            if (cur.end >= end) {

                this._shrink();

                return this;      
            
            }

            if (cur.end < end) {
            
                cur.end     = end;

                this._shrink();

                return this;

            }

        }
 
    }

    this._list.push({ start: start, end: end });

    this._shrink();
    
    return this;

});

RangeList.method('getList', function () {

    return this._list;

});
