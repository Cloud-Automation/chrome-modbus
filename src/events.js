var Events = function () {

    if (!(this instanceof Events)) {
        return new Events();
    }

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

Events.method('fireLater', function (name, args) {

    if (args === undefined) {
        args = [];
    }

    return function () {

        var a = args.concat(arguments);

        this.fire(name, a===[]?a:undefined);

    }.bind(this);

});

Events.method('on', function (name, func) {

    if (!this._cbList[name]) {
        this._cbList[name] = [];
    }

    this._cbList[name].push(func);

    return { name: name, index: this._cbList[name].length - 1 };

});

Events.method('off', function (id) {

    this._cbList[id.name].splice(id.index);

    return this;

});
