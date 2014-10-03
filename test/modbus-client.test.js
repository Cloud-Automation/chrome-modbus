
function ModbusClientTest() {

    var that = this;

    chrome                          = { };
    chrome.sockets                  = { };
    chrome.sockets.tcp              = { };
    chrome.sockets.tcp.create       = createMockFunction();
    chrome.sockets.tcp.connect      = createMockFunction();
    chrome.sockets.tcp.destroy      = createMockFunction();
    chrome.sockets.tcp.disconnect   = createMockFunction();
    chrome.sockets.tcp.setPaused    = createMockFunction();
    chrome.sockets.tcp.onReceive    = { };
    chrome.sockets.tcp.onReceive.addListener = function (cb) {
    
        that.onReceiveListener = cb; 

    };

    chrome.sockets.tcp.onReceiveError = { };
    chrome.sockets.tcp.onReceiveError.addListener = function (cb) {
      
        that.onReceiveErrorListener = cb;
        
    };


    this.client = new ModbusClient();

};

registerTestSuite(ModbusClientTest);

var proto = ModbusClientTest.prototype;

proto.connectionFailure = function () {

    expectCall(chrome.sockets.tcp.create)(_,_)
        .willOnce(function (o, cb) { cb({socketId: 1}); });

    expectCall(chrome.sockets.tcp.connect)(1, '127.0.0.1', 502, _)
        .willOnce(function (sid, host, port, cb) { cb( -1 ); });

    var failureCallback = createMockFunction(),
        successCallback = createMockFunction ();

    this.client.on('connect_error', failureCallback);
    this.client.on('connected', successCallback);

    expectCall(failureCallback)(_).times(1);
    expectCall(successCallback)().times(0);

    this.client.connect('127.0.0.1', 502);

};

proto.establishConnection = function () {

    expectCall(chrome.sockets.tcp.create)(_,_)
        .willOnce(function (o, cb) { cb({socketId: 1}); });


    expectCall(chrome.sockets.tcp.connect)(1, '127.0.0.1', 502, _)
        .willOnce(function (sid, host, port, cb) { cb(0); });

    var failureCallback = createMockFunction(),
        successCallback = createMockFunction();

    this.client.on('connect_error', failureCallback);
    this.client.on('connected', successCallback);

    expectCall(failureCallback)().times(0);
    expectCall(successCallback)().times(1);

    this.client.connect('127.0.0.1', 502);

};

proto.disconnect = function () {

    this.establishConnection();

    expectCall(chrome.sockets.tcp.disconnect)(1, _)
        .willOnce(function (id, cb) { cb(); });

    var cb = createMockFunction();

    expectCall(cb)().times(1);

    this.client.on('disconnected', cb);

    this.client.disconnect();

};

proto.reconnect = function () {

    expectCall(chrome.sockets.tcp.create)(_,_)
        .willOnce(function (o, cb) { cb({socketId: 1}); });

    expectCall(chrome.sockets.tcp.connect)(1, '127.0.0.1', 502, _)
        .times(2)
        .willRepeatedly(function (id, host, port, cb) { cb(0); });

    expectCall(chrome.sockets.tcp.disconnect)(1, _)
        .willOnce(function (id, cb) { cb() });

    expectCall(chrome.sockets.tcp.setPaused)(1, false, _)
        .willOnce(function (id, pause, cb) { cb() });

    var mock = createMockFunction();

    expectCall(mock)().times(2)
        .willOnce(function () { this.onReceiveErrorListener(); }.bind(this))
        .willOnce(function () { });

    this.client.on('connected', mock);
    
    this.client.on('error', function () {
 
        this.client.reconnect();
   
    }.bind(this));

    this.client.connect('127.0.0.1', 502);

};

/*
describe('ModbusClient ReadCoils Test.', function () {

    var socket_api,
        socketMock,
        listenerSpy,
        receiveListener,
        client;

    beforeEach(function () {
 
        socket_api = {
            read        : function () { },
            send        : function () { }
        };

        socketMock = sinon.mock(socket_api);
        socket_api.onReceive = {
            addListener: function () { }
        };
        listenerSpy = sinon.spy(socket_api.onReceive, 'addListener');

        client = ModbusClient({ socketId: 1 }, socket_api); 

        receiveListener = listenerSpy.getCall(0).args[0];
    });

    it('Should send read coils packet.', function () { 

        var data        = new ArrayBuffer(12),
            dv          = new DataView(data, 0, 12);

        // MBAP
        dv.setUint16(0, 0);   // tid
        dv.setUint16(2, 0);   // pid
        dv.setUint16(4, 6);   // length
        dv.setUint8(6, 255);
        dv.setUint8(7, 1);    // read coils 0x01
        dv.setUint16(8, 5);   // start address 0x05
        dv.setUint16(10, 4);  // count = 4

        socketMock.expects('send').once()
            .withArgs(1, ArrayBufferMatch(data, 12));

        client.readCoils(5, 4);

        socketMock.verify();
    
    });

    it('Should send read input registers packet.', function () {
    
        var data        = new ArrayBuffer(12),
            dv          = new DataView(data, 0, 12);

        // MBAP
        dv.setUint16(0, 0);     // tid
        dv.setUint16(2, 0);     // pid
        dv.setUint16(4, 6);     // length
        dv.setUint8(6, 255);
        dv.setUint8(7, 4);      // read input registers 0x04
        dv.setUint16(8, 3);     // start address 0x03
        dv.setUint16(10, 10);   // count = 10

        socketMock.expects('send').once()
            .withArgs(1, ArrayBufferMatch(data, 12));

        client.readInputRegisters(3, 10);

        socketMock.verify();

    });

    it('Should send single coil package.', function () {
    
        var data_true   = new ArrayBuffer(12),
            data_false  = new ArrayBuffer(12),
            dv_true     = new DataView(data_true, 0, 12),
            dv_false    = new DataView(data_false, 0, 12);

        // MBAP
        dv_true.setUint16(0, 0);     // tid
        dv_true.setUint16(2, 0);     // pid
        dv_true.setUint16(4, 6);     // length
        dv_true.setUint8(6, 255);
        dv_true.setUint8(7, 5);      // write single coil 0x05
        dv_true.setUint16(8, 3);     // start address 0x03
        dv_true.setUint16(10, 0xff00);   // value = true

        // MBAP
        dv_false.setUint16(0, 1);       // tid
        dv_false.setUint16(2, 0);       // pid
        dv_false.setUint16(4, 6);       // length
        dv_false.setUint8(6, 255);
        dv_false.setUint8(7, 5);        // write single coil 0x05
        dv_false.setUint16(8, 4);       // start address 0x04
        dv_false.setUint16(10, 0x0000); // value = false

        socketMock.expects('send').once()
            .withArgs(1, ArrayBufferMatch(data_true, 12));

        socketMock.expects('send').once()
            .withArgs(1, ArrayBufferMatch(data_false, 12));

        client.writeSingleCoil(3, true);
        client.writeSingleCoil(4, false);

        socketMock.verify();
    
    });

    it('Should send write single register package.', function () {
    
        var data    = new ArrayBuffer(12),
            dv      = new DataView(data, 0, 12);

        // MBAP
        dv.setUint16(0, 0);     // tid
        dv.setUint16(2, 0);     // pid
        dv.setUint16(4, 6);     // length
        dv.setUint8(6, 255);
        dv.setUint8(7, 6);      // write single register 0x06
        dv.setUint16(8, 10);     // start address 0xa
        dv.setUint16(10, 1234);   // value = 1234

        socketMock.expects('send').once()
            .withArgs(1, ArrayBufferMatch(data, 12));

        client.writeSingleRegister(10, 1234);

        socketMock.verify();
    });

    it('Should receive an answer packet to a readCoils call.', 
        function (done) {
   
        socketMock.expects('send').once();

        client.on('error', function () {
        
            console.log('error', arguments);
            true.should.be.false('An error was thrown.');
            done();
        
        });

        client.readCoils(0, 10).then(function (data, res) {

            socketMock.verify();
          
            data.length.should.equal(10);

            for (var i = 0; i < 10; i += 1) {
                data[i].should.equal(1);
            }

            done();

        }).fail(function () {

            true.should.be.false('Request rejected.');
            done();
        
        });

        var data    = new ArrayBuffer(7 + 2 + 2),
            dv      = new DataView(data, 0, 11);

        dv.setUint16(0, 0);
        dv.setUint16(2, 0);
        dv.setUint16(4, 4);
        dv.setUint8(6, 1);
        dv.setUint8(7, 1);
        dv.setUint8(8, 2);
        dv.setUint8(9, 0xff);
        dv.setUint8(10, 0x03);

        receiveListener(data);
    
    });

    it('Should receive an answer packet to a readInputRegisters call.', 
        function (done) {
   
        socketMock.expects('send').once();

        client.on('error', function () {
        
            console.log('error', arguments);
            should.fail('An error was thrown.');
            done();
        
        });

        client.readInputRegisters(0, 10).then(function (data, res) {

            socketMock.verify();
          
            data.length.should.equal(10);

            for (var i = 0; i < 10; i += 1) {
                data[i].should.equal(i);
            }

            done();

        }).fail(function () {

            console.log(arguments);
            false.should.be.ok('Request rejected.');
            done();
        
        });

        var data    = new ArrayBuffer(7 + 2 + 20),
            dv      = new DataView(data, 0, 29);

        dv.setUint16(0, 0);
        dv.setUint16(2, 0);
        dv.setUint16(4, 4);
        dv.setUint8(6, 1);
        dv.setUint8(7, 4);
        dv.setUint8(8, 20);
        dv.setUint16(9, 0x00);
        dv.setUint16(11, 0x01);
        dv.setUint16(13, 0x02);
        dv.setUint16(15, 0x03);
        dv.setUint16(17, 0x04);
        dv.setUint16(19, 0x05);
        dv.setUint16(21, 0x06);
        dv.setUint16(23, 0x07);
        dv.setUint16(25, 0x08);
        dv.setUint16(27, 0x09);

        receiveListener(data);
    
    });

    it('Should receive an answer packet to a writeSingleCoil call.', 
        function (done) {
   
        socketMock.expects('send').once();

        client.on('error', function () {
        
            console.log('error', arguments);
            should.fail('An error was thrown.');
            done();
        
        });

        client.writeSingleCoil(0, true).then(function (res) {

            socketMock.verify();
          
            done();

        }).fail(function () {

            console.log(arguments);
            false.should.be.ok('Request rejected.');
            done();
        
        });

        var data    = new ArrayBuffer(7 + 2 + 5),
            dv      = new DataView(data, 0, 14);

        dv.setUint16(0, 0);
        dv.setUint16(2, 0);
        dv.setUint16(4, 4);
        dv.setUint8(6, 1);
        dv.setUint8(7, 5);
        dv.setUint16(8, 0);
        dv.setUint16(9, 0xFF00);

        receiveListener(data);
    
    });


    it('Should receive an answer packet to a writeSingleRegister call.', 
        function (done) {
   
        socketMock.expects('send').once();

        client.on('error', function () {
        
            console.log('error', arguments);
            should.fail('An error was thrown.');
            done();
        
        });

        client.writeSingleRegister(0, 1234).then(function (res) {

            socketMock.verify();
          
            done();

        }).fail(function () {

            console.log(arguments);
            false.should.be.ok('Request rejected.');
            done();
        
        });

        var data    = new ArrayBuffer(7 + 2 + 5),
            dv      = new DataView(data, 0, 14);

        dv.setUint16(0, 0);
        dv.setUint16(2, 0);
        dv.setUint16(4, 4);
        dv.setUint8(6, 1);
        dv.setUint8(7, 6);
        dv.setUint16(8, 0);
        dv.setUint16(9, 1234);

        receiveListener(data);
    
    });

    it('Should receive an answer without a response handler.', 
        function (done) {
   
        socketMock.expects('send').once();

        // send something and don't care about the result
        client.readCoils(2, 3);

        client.on('error', function (err) {

            err.errCode.should.equal('noResponseHandler');

            socketMock.verify();
            done();
        
        });

        // send data back with id from the previous call and
        // a different function code (fc)
        var data    = new ArrayBuffer(7 + 2 + 5),
            dv      = new DataView(data, 0, 14);

        dv.setUint16(0, 0);
        dv.setUint16(2, 0);
        dv.setUint16(4, 4);
        dv.setUint8(6, 1);
        dv.setUint8(7, 8); // not implemented 
        dv.setUint16(8, 0);
        dv.setUint16(9, 0xFF00);

        receiveListener(data);
    
    });


    it('Should receive an answer without a user handler.', 
        function (done) {
   
        client.on('error', function (err) {
       
            err.errCode.should.equal('noHandler');

            socketMock.verify();
            done();
        
        });

        var data    = new ArrayBuffer(7 + 2 + 5),
            dv      = new DataView(data, 0, 14);

        dv.setUint16(0, 0);
        dv.setUint16(2, 0);
        dv.setUint16(4, 4);
        dv.setUint8(6, 1);
        dv.setUint8(7, 5); 
        dv.setUint16(8, 0);
        dv.setUint16(9, 0xFF00);

        receiveListener(data);
    
    });


}); */
