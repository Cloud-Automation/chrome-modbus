var Events = function () {

    this._cbList = { };

};

Events.method('fire', function (name, args) {

    if (!this._cbList[name]) {
    
        return;

    }

    for (var i in this._cbList[name]) {
        
        this._cbList[name][i].apply(this, args);
    
    }

});

Events.method('fireLater', function (name) {

    var that = this, 
        args = [];

    if (arguments.length > 1) {
        args = Array.prototype.slice.call(arguments, 1);
    }

    return function () {
    
        that.fire(name, args.concat(arguments));

    };

});

Events.method('on', function (name, func) {

    if (!this._cbList[name]) {
        this._cbList[name] = [];
    }

    this._cbList[name].push(func);

    return { name: name, index: this._cbList[name].length-1 };

});

Events.method('off', function (id) {

    this._cbList[id.name].splice(id.index);

    return this;

});
