(function () {

    var Page = function (root) {
    
        if (!(this instanceof Page)) {
            return new Page(root);
        }

        Events.call(this);

        this._root = $(root);

        this._root.hide();

    };

    Page.inherits(Events);

    Page.method('hide', function () {
        this._root.hide();
        this.fire('page_hidden');
    });

    Page.method('show', function () {
        this._root.show();
        this.fire('page_visible');
    });


    ConnectPage = function () {
    
        if (!(this instanceof ConnectPage)) {
            return new ConnectPage();
        }

        Page.call(this, '#connect');

        $('#connect_button').on('click', this.fireLater('connect_clicked'));

    };

    ConnectPage.inherits(Page);

    ConnectPage.method('getHost', function () {
    
        return $('#host').val();

    });

    ConnectPage.method('getPort', function () {
    
        return parseInt($('#port').val());
    
    });

    ConnectPage.method('disable', function () {
    
        $('#host').attr('disabled', 'disabled');
        $('#port').attr('disabled', 'disabled');
        $('#connect_button').attr('disabled', 'disabled');

    });

    ConnectPage.method('enable', function () {
 
        $('#host').removeAttr('disabled');
        $('#port').removeAttr('disabled');
        $('#connect_button').removeAttr('disabled');
   
    
    });

    ConnectPage.method('setLast', function (last) {
    
        $('#last_body').empty();

        var host, port, row;

        for (var i = 0; i < last.length; i += 1) {
        
            host = $('<td></td>').html(last[i].host);
            port = $('<td></td>').html(last[i].port);

            row = $('<tr></tr>').append(host, port);

            row.on('click', (function () {
            
                var h = last[i].host, p = last[i].port;

                return function () {
                
                    $('#host').val(h);
                    $('#port').val(p);
                
                }

            })());

            $('#last_body').append(row);

        }

    });

    SetupPage = function () {
    
        if (!(this instanceof SetupPage)) {
            return new SetupPage();
        }

        Page.call(this, '#register_setup');
   
        $('#setup_disconnect').on('click', this.fireLater('disconnect_clicked'));

        $('#setup_register').on('click', this.fireLater('setup_clicked'));
    };

    SetupPage.inherits(Page);

    SetupPage.method('getOffset', function () {
    
        var offset = parseInt($('#offset').val());

        if (isNaN(offset)) {
            return -1;
        }

        return offset;
    
    });

    ConsolePage = function () {
    
        if (!(this instanceof ConsolePage)) {
            return new ConsolePage();
        }

        Page.call(this, '#console');

        $('#console_disconnect').on('click', this.fireLater('disconnect_clicked'));
        $('#back').on('click', this.fireLater('back_clicked'));
        $('#c_ex').on('click', this.fireLater('ok_clicked'));
    };

    ConsolePage.inherits(Page);

    ConsolePage.method('getCommand', function () {
    
        return parseInt($('#c_cmd').val());
    
    });

    ConsolePage.method('getParameter', function () {
    
        return parseInt($('#c_arg').val());
    
    });

    PageManager = function () {
    
        if (!(this instanceof PageManager)) {
            return new PageManager();
        }

        this._pages = [ ];
    
    };

    PageManager.method('addPage', function (page) {
        this._pages.push(page);
    });

    PageManager.method('showPage', function (page) {
    
        for (var i in this._pages) {
            if (this._pages[i] !== page) {
                this._pages[i].hide();
            }
        }

        page.show();
    
    });

    PageManager.method('log', function (text) {
    
        $('#status').removeClass('error')
            .addClass('ok').html(text);

    });

    PageManager.method('log_error', function (text) {

        $('#status').removeClass('ok')
            .addClass('error').html(text);
    
    });

    App = new PageManager();


})();
