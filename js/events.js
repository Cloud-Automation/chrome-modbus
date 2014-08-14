(function () {

    Events = function () {
   
        this._cbList = { };

    };

    Events.method('fire', function (name, args) {
    
        if (!this._cbList[name]) {
        
            return;

        }
 
        for (var i in this._cbList[name]) {
            
            this._cbList[name][i].apply(null, args);
        
        }
    
    });

    Events.method('fireLater', function (name) {
    
        var that = this;

        return function () {
        
            that.fire(name, arguments);

        };

    });

    Events.method('on', function (name, func) {
 
        if (!this._cbList[name]) {
            this._cbList[name] = [];
        }

        this._cbList[name].push(func);

        return this;
    
    });

})();
