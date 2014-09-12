
all: dev min

dev: js/sugar.js js/events.js js/modbus-client.js js/modbus-poll.js js/modbus.js
	cat js/sugar.js js/events.js js/modbus-client.js js/modbus-poll.js js/modbus.js > modbus.min.js	

min: js/sugar.js js/events.js js/modbus-client.js js/modbus-poll.js js/modbus.js
	uglifyjs -c drop_console=true js/sugar.js js/events.js js/modbus-client.js js/modbus-poll.js js/modbus.js -o modbus.min.js	

