# Chrome Modbus

Client and Server implementation for the Modbus TCP/IP Protocol. The client supports the function codes 1,3,4,5,6.

## Installation

The Project depends on jQuery so make sure to include jQuery into your App. (Note: Chrome Modbus currently uses the promise API from jQuery, it is planed to switch to Q, so this is subject to change.)

Insert the modbus.min.js into your project.

    <script src="modbus.min.js"></script>

## Client Setup

Create a client object.

    var client = new ModbusClient();

Setup different handler.

If a connect attempt succeeded the 'online' event is fired,

    client.on('online', function () {

       console.log('connected');

    });

If the client gets disconnected the 'offline' event is fired.

    client.on('offline', function () {

        console.log('disconnected');

    });

If there is a connection error the error event is fired. You can use this event to reconnect for example.

    client.on('error', function () {

        setTimeout(function () {

            client.reconnect();

        }, 5000);

    });

Connect to a Modbus Server.

    client.connect(host, port);

### Execute function calls.

The supported function calls return a promise. So add a callback to then with the data and the original request object to handle a successfull operation.

#### FC 01 - Read Coils

    client.readCoils(start, count).then(function (data, request) {

        ...

    }).fail(function (err) {

        ...

    });

#### FC 03 - Read Holding Registers

    client.readHoldingRegisters(start, count);

#### FC 04 - Read Input Registers

    client.readInputRegisters(start, count);

#### FC 05 - Write Single Coil

    client.writeSingleCoil(address, value).then(function (request) { ... })
        .fail(function (err) { ... });

#### FC 06 - Write Single Register

    client.writeSingleRegister(address, value).then(function (request) { ... })
        .fail(function (err) { ... });

## Loop

Modbus Loops are a tool to poll certain modbus requests in a loop. Create a loop and call the modbus functions to register them. Start the loop to get updates.

Create a new loop instance.

    var loop = new ModbusLoop(client);

Register a new function call for this loop;

    loop.readInputRegisters(0, 10);

    loop.readHoldingRegisters(0, 10);

Handle loop updates.

    loop.on('update', function (inputRegisters, holdingRegisters) {

        // input registers 0 .. 9 are in inputRegisters[0] .. inputRegisters[9]
        // holding registers 0 .. 9 are in holdingRegisters[0] .. holdingRegisters[9]

    });

Start the loop.

    loop.start();

Stop the loop.

    loop.stop();

Handle errors.

    loop.on('error', function (err) {

        // loop is automatically stopped

        loop.start();

    });

Note: You can add new modbus requests at any time.

 Licence

The MIT License (MIT)
Copyright © 2014 Stefan Pöter, stefan.poeter[at]cloud-automation.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
