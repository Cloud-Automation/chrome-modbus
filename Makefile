
SRC	= src
BIN	= bin
TST	= test

all: all-examples min

min: $(SRC)/sugar.js $(SRC)/events.js $(SRC)/statemachine.js $(SRC)/modbus-client.js $(SRC)/modbus-loop.js $(SRC)/modbus-server.js $(SRC)/register.js
	uglifyjs -c drop_console=true --enclose='' $(SRC)/sugar.js $(SRC)/events.js $(SRC)/statemachine.js $(SRC)/modbus-client.js $(SRC)/modbus-loop.js $(SRC)/modbus-server.js $(SRC)/register.js -o $(BIN)/modbus.min.js	

dev: $(SRC)/sugar.js $(SRC)/events.js $(SRC)/statemachine.js $(SRC)/modbus-client.js $(SRC)/modbus-loop.js $(SRC)/modbus-server.js $(SRC)/register.js
	uglifyjs --enclose='' $(SRC)/sugar.js $(SRC)/events.js $(SRC)/statemachine.js $(SRC)/modbus-client.js $(SRC)/modbus-loop.js $(SRC)/modbus-server.js $(SRC)/register.js -o $(BIN)/modbus.min.js

all-examples: example_05 example_04 example_03 example_02 example_01

example_05: dev
	cp $(BIN)/modbus.min.js examples/example_05/

example_04: dev
	cp $(BIN)/modbus.min.js examples/example_04/

example_03: dev
	cp $(BIN)/modbus.min.js examples/example_03/

example_02: dev
	cp $(BIN)/modbus.min.js examples/example_02/

example_01: dev
	cp $(BIN)/modbus.min.js examples/example_01/

test: test-events test-statemachine

test-events: $(SRC)/events.js $(TST)/events.test.js
	gjstest --js_files=$(TST)/common.js,$(SRC)/sugar.js,$(SRC)/events.js,$(TST)/events.test.js

test-statemachine: $(SRC)/events.js $(SRC)/statemachine.js $(TST)/statemachine.test.js
	gjstest --js_files=$(TST)/common.js,$(SRC)/sugar.js,$(SRC)/events.js,$(SRC)/statemachine.js,$(TST)/statemachine.test.js
