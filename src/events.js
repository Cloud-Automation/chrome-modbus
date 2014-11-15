//= include sugar.js

var Events = function () {

    if (!(this instanceof Events))
        return new Events();

    var cbList = { };

    this.fire = function (name, args) {
    
        if (!cbList[name]) {

            return;

        }

        for (var i in cbList[name]) {
            
            cbList[name][i].apply(this, args);
        
        }

        return this;
    
    };

    
    this.fireLater = function (name, args) {

        if (args === undefined) {

            args = [];

        }

        return function () {

            var aA  = Array.protoype.slice.call(arguments, 0),
                a   = args.concat(aA);

            this.fire(name, a.length > 0 ? a : undefined);

        }.bind(this);

    };

    this.on = function (name, func) {

        if (!cbList.hasOwnProperty(name)) {

            cbList[name] = [];
        
        }

        cbList[name].push(func);

        return { 
            name    : name, 
            index   : cbList[name].length - 1 
        };

    };

    this.off = function (id) {

        cbList[id.name].splice(id.index);

        return this;

    };

};


