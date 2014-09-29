# Chrome Modbus

Client and Server implementation for the Modbus TCP/IP Protocol. The client and the server support the function codes 4,5,6,7.

## Installation

Insert the modbus.min.js into your project.

    <script src="modbus.min.js"></script>

## Client Setup

Create a client object.

    var client = new ModbusClient();

Setup handler.

    client.on('connected', function () {

       console.log('connected'); 

    });

    client.on('disconnected', function () {

        console.log('disconnected');

    });

    client.on('error', function () {

        setTimeout(function () {

            client.reconnect();

        }, 5000);

    });

Connect to a Modbus Server.

    client.connect(host, port);

### Execute function calls.

    client.readInputRegisters(0, 10).then(function (data) {

        ...

    }).fail(function (err) {

        console.log(err);

    });

## Loop

Create a new loop instance with a loop duration of 100ms.

    var loop = new ModbusLoop(client, 100);

Register a new function call for this loop;

    var loop_id = loop.readInputRegisters(0, 10);

Handle loop updates.

    loop.on(loop_id, function (data) {

    });

Start the loop.

    loop.start();

Stop the loop.

    loop.stop();

Handle errors.

    loop.on('error', function (err) {

        // loop is automatically stopped
        // restart the loop

        loop.start();

    });

