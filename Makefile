
dev: js/sugar.js js/events.js js/modbus-client.js js/modbus-poll.js js/modbus.js
	cat js/sugar.js js/events.js js/modbus-client.js js/modbus-poll.js js/modbus.js > modbus.dev.js	

min: js/sugar.js js/events.js js/modbus-client.js js/modbus-poll.js js/modbus.js
	uglifyjs js/sugar.js js/events.js js/modbus-client.js js/modbus-poll.js js/modbus.js > modbus.min.js	

