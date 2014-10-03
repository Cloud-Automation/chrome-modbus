$(document).ready(function () {

    $('.tabs li').on('click', function () {
    
        var tab_id = $(this).data('for');

        $('.tabs li.active').removeClass('active');
        $(this).addClass('active');

        $('.tab.visible').removeClass('visible');
        $('#' + tab_id).addClass('visible');

    });

    var server;

    var update_input_table = function () {
   
        console.log('update inputs table called.', server._input_register);

        var tbody = $('#input_registers_body'),
            tr, td_index, td_val, td_hex, td_bin;

        tbody.empty();


        for (var i in server._input_register) {
        
            tr = $('<tr></tr>');
            td_index = $('<td></td>').html(i);
            td_val = $('<td></td>').html(server._input_register[i]);
            td_hex = $('<td></td>').html(server._input_register[i].toString(16));
            td_bin = $('<td></td>').html(server._input_register[i].toString(2));

            tr.append(td_index, td_val, td_hex, td_bin);
            tbody.append(tr);

        }
    
    };

    var update_holding_table = function () {
   
        var tbody = $('#holding_registers_body'),
            tr, td_index, td_val, td_hex, td_bin;

        tbody.empty();


        for (var i in server._holding_register) {
        
            tr = $('<tr></tr>');
            td_index = $('<td></td>').html(i);
            td_val = $('<td></td>').html(server._holding_register[i]);
            td_hex = $('<td></td>').html(server._holding_register[i].toString(16));
            td_bin = $('<td></td>').html(server._holding_register[i].toString(2));

            tr.append(td_index, td_val, td_hex, td_bin);
            tbody.append(tr);

        }
    
    };


    var start_server = function () {
    
        var host = $('#host').val(),
            port = parseInt($('#port').val());

        server = new ModbusServer(host, port, 200); // with simulation delay

        server.createNewRegister(12288);

        server.start();


        server.on('write_single_register', update_holding_table);
        server.on('read_input_registers', update_input_table);

        server.on('read_holding_registers', update_holding_table);

        $('#start_server').html('Stop');

        $('#start_server').off('click').on('click', stop_server);
    
    };

    var stop_server = function () {
    
        if (!server) {
            return;
        }

        server.stop();

        $('#start_server').html('Start');

        $('#start_server').off('click').on('click', start_server);
    
    };

    $('#start_server').on('click', start_server);

});
