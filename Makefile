
SRC	= src
BIN	= bin

min: $(SRC)/sugar.js $(SRC)/events.js $(SRC)/modbus-client.js $(SRC)/modbus-loop.js $(SRC)/modbus.js $(SRC)/register.js
	uglifyjs -c drop_console=true $(SRC)/sugar.js $(SRC)/events.js $(SRC)/modbus-client.js $(SRC)/modbus-loop.js $(SRC)/modbus.js $(SRC)/register.js -o $(BIN)/modbus.min.js	

dev: $(SRC)/sugar.js $(SRC)/events.js $(SRC)/modbus-client.js $(SRC)/modbus-loop.js $(SRC)/modbus.js $(SRC)/register.js
	cat $(SRC)/sugar.js $(SRC)/events.js $(SRC)/modbus-client.js $(SRC)/modbus-loop.js $(SRC)/modbus.js $(SRC)/register.js > $(BIN)/modbus.min.js	



