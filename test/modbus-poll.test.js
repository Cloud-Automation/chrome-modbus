describe('ModbusPoll Tests.', function () {

    var client,
        clientMock;

    beforeEach(function () {
    
        client = {
        
        };

        clientMock = sinon.mock(client);
    
    });

    it('Should start a loop.', function () {
   
        var poll = ModbusPoll(client, 100),
            readId;

        readId = poll.readInputRegisters(10, 30);

        poll.on(readId, function (data) {
        
        });

        poll.on('error', function () {
        
            poll.start();
        });

        poll.start(); 
        
    
    });


});
