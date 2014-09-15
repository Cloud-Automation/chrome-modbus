Function.prototype.method = function (name, func) {

    this.prototype[name] = func;
    return this;

};

Function.method('inherits', function (superCtor) {

    this.super_ = superCtor;
    this.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: this,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    return this;
});

