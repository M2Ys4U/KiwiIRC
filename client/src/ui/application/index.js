define('ui/application',
    ['lib/lodash', 'lib/backbone', 'misc/gateway', 'ui/application/view', 'ui/networkpanellist', 'ui/paneltabs', 'ui/controlbox', 'misc/clientuicommands', 'ui/rightbar', 'ui/topicbar', 'ui/apptoolbar', 'ui/channeltools', 'ui/statusmessage', 'ui/resizehandler', 'ui/panels/applet', 'ui/panels/panel', 'ui/menubox', 'misc/datastore', 'ui/notification', 'helpers/styletext', 'helpers/translator', 'helpers/theme', 'helpers/settings', 'helpers/events', 'helpers/connections'],
    function (_, Backbone, Gateway, ApplicationView, NetworkPanelList, PanelTabs, ControlBox, ClientUiCommands, RightBar, TopicBar, AppToolBar, ChannelTools, StatusMessage, ResizeHandler, AppletPanel, Panel, MenuBox, DataStore, Notification, styleText, translator, theme, settings, events, connections) {

    // Singleton instance
    var instance = null;

    var gateway_instance, build_version;

    var Application = Backbone.Model.extend({
        view: null,

        message: null,

        initialize: function (options, _build_version) {
            instance = this;
            this.app_options = options;
            build_version = _build_version;

            if (options.container) {
                this.set('container', options.container);
            }

            // The base url to the kiwi server
            this.set('base_path', options.base_path ? options.base_path : '');

            // Path for the settings.json file
            this.set('settings_path', options.settings_path ?
                    options.settings_path :
                    this.get('base_path') + '/assets/settings.json'
            );

            // Any options sent down from the server
            this.server_settings = options.server_settings || {};
            translator.setTranslations(options.translations || {});
            this.themes = options.themes || [];
            theme.setTextTheme(options.text_theme || {});

            // The applet to initially load
            this.startup_applet_name = options.startup || 'kiwi_startup';

            // Set any default settings before anything else is applied
            if (this.server_settings && this.server_settings.client && this.server_settings.client.settings) {
                this.applyDefaultClientSettings(this.server_settings.client.settings);
            }
        },


        initializeInterfaces: function () {
            var kiwi_server = '';

            // The kiwi server to connect to may be a string for a single option,
            // or an array of kiwi servers to pick one at random from.
            if (typeof this.app_options.kiwi_server === 'string') {
                kiwi_server = this.app_options.kiwi_server;
            } else if (_.isArray(this.app_options.kiwi_server)) {
                kiwi_server = _.sample(this.app_options.kiwi_server);
            } else {
                // Best guess at where the kiwi server is
                kiwi_server = this.detectKiwiServer();
            }

            // Set the gateway up
            gateway_instance = new Gateway({kiwi_server: kiwi_server, build_version: build_version});
            this.bindGatewayCommands(gateway_instance);

            this.initializeClient();
            this.initializeGlobals();

            this.view.barsHide(true);
        },


        detectKiwiServer: function () {
            // If running from file, default to localhost:7777 by default
            if (window.location.protocol === 'file:') {
                return 'http://localhost:7778';
            } else {
                // Assume the kiwi server is on the same server
                return window.location.protocol + '//' + window.location.host;
            }
        },


        showStartup: function() {
            this.startup_applet = AppletPanel.load(this.startup_applet_name, {no_tab: true});
            this.startup_applet.tab = this.view.$('.console');
            this.startup_applet.view.show();

            events.emit('loaded');
        },


        initializeClient: function () {
            this.view = new ApplicationView({model: this, el: this.get('container')});

            // Takes instances of model_network
            this.connections = new NetworkPanelList(null, null, Application);

            // If all connections are removed at some point, hide the bars
            this.connections.on('remove', _.bind(function() {
                if (this.connections.length === 0) {
                    this.view.barsHide();
                }
            }, this));

            // Applets panel list
            console.log(PanelTabs);
            this.applet_panels = new PanelTabs();
            this.applet_panels.view.$el.addClass('panellist applets');
            this.view.$el.find('.tabs').append(this.applet_panels.view.$el);

            /**
             * Set the UI components up
             */
            this.controlbox = (new ControlBox({el: $('#kiwi .controlbox')[0]}, Application, _kiwi)).render();
            this.client_ui_commands = new ClientUiCommands(this, this.controlbox);

            this.rightbar = new RightBar({el: this.view.$('.right-bar')[0]});
            this.topicbar = new TopicBar({el: this.view.$el.find('.topic')[0]});

            new AppToolBar({el: this.view.$el.find('.toolbar .app-tools')[0]}); //jshint ignore:line
            new ChannelTools({el: this.view.$el.find('.channel-tools')[0]}); //jshint ignore:line

            this.message = new StatusMessage({el: this.view.$el.find('.status-message')[0]});

            this.resize_handle = new ResizeHandler({el: this.view.$el.find('.memberlists-resize-handle')[0]});

            // Rejigg the UI sizes
            this.view.doLayout();
        },


        initializeGlobals: function () {
            connections = this.connections;
        },


        applyDefaultClientSettings: function (new_settings) {
            _.each(new_settings, function (value, setting) {
                if (typeof settings.get(setting) === 'undefined') {
                    settings.set(setting, value);
                }
            });
        },


        panels: (function() {
            var active_panel;

            var fn = function(panel_type) {
                var application = Application.instance(),
                    panels;

                // Default panel type
                panel_type = panel_type || 'connections';

                switch (panel_type) {
                case 'connections':
                    panels = application.connections.panels();
                    break;
                case 'applets':
                    panels = application.applet_panels.models;
                    break;
                }

                // Active panels / server
                panels.active = active_panel;
                panels.server = application.connections.active_connection ?
                    application.connections.active_connection.panels.server :
                    null;

                return panels;
            };

            _.extend(fn, Backbone.Events);

            // Keep track of the active panel. Channel/query/server or applet
            fn.bind('active', function (new_active_panel) {
                var previous_panel = active_panel;
                active_panel = new_active_panel;

                events.emit('panel:active', {previous: previous_panel, active: active_panel});
            });

            return fn;
        })(),


        bindGatewayCommands: function (gw) {
            var that = this;

            // As soon as an IRC connection is made, show the full client UI
            gw.on('connection:connect', function () {
                that.view.barsShow();
            });


            /**
             * Handle the reconnections to the kiwi server
             */
            (function () {
                // 0 = non-reconnecting state. 1 = reconnecting state.
                var gw_stat = 0;

                gw.on('disconnect', function () {
                    that.view.$el.removeClass('connected');

                    // Reconnection phase will start to kick in
                    gw_stat = 1;
                });


                gw.on('reconnecting', function (event) {
                    var msg = translator.translateText('client_models_application_reconnect_in_x_seconds', [event.delay/1000]) + '...';

                    // Only need to mention the repeating re-connection messages on server panels
                    that.connections.forEach(function(connection) {
                        connection.panels.server.addMsg('', styleText('quit', {text: msg}), 'action quit');
                    });
                });


                // After the socket has connected, kiwi handshakes and then triggers a kiwi:connected event
                gw.on('kiwi:connected', function () {
                    var msg;

                    that.view.$el.addClass('connected');

                    events.emit('connected');

                    // If we were reconnecting, show some messages we have connected back OK
                    if (gw_stat === 1) {

                        // No longer in the reconnection state
                        gw_stat = 0;

                        msg = translator.translateText('client_models_application_reconnect_successfully') + ' :)';
                        that.message.text(msg, {timeout: 5000});

                        // Mention the re-connection on every channel
                        that.connections.forEach(function(connection) {
                            connection.reconnect();

                            connection.panels.server.addMsg('', styleText('rejoin', {text: msg}), 'action join');

                            connection.panels.forEach(function(panel) {
                                if (!panel.isChannel()) {
                                    return;
                                }

                                // The memberlist will reset itself and be updated with NAMES output
                                panel.get('members').reset();

                                panel.addMsg('', styleText('rejoin', {text: msg}), 'action join');
                            });
                        });
                    }

                });
            })();


            gw.on('kiwi:reconfig', function () {
                $.getJSON(that.get('settings_path'), function (data) {
                    that.server_settings = data.server_settings || {};
                    translator.setTranslations(data.translations || {});
                });
            });


            gw.on('kiwi:jumpserver', function (data) {
                var serv;
                // No server set? Then nowhere to jump to.
                if (typeof data.kiwi_server === 'undefined') {
                    return;
                }

                serv = data.kiwi_server;

                // Strip any trailing slash from the end
                if (serv[serv.length-1] === '/') {
                    serv = serv.substring(0, serv.length-1);
                }

                // Force the jumpserver now?
                if (data.force) {
                    // Get an interval between 5 and 6 minutes so everyone doesn't reconnect it all at once
                    var jump_server_interval = Math.random() * (360 - 300) + 300;
                    jump_server_interval = 1;

                    // Tell the user we are going to disconnect, wait 5 minutes then do the actual reconnect
                    var msg = translator.translateText('client_models_application_jumpserver_prepare');
                    that.message.text(msg, {timeout: 10000});

                    setTimeout(function forcedReconnect() {
                        var msg = translator.translateText('client_models_application_jumpserver_reconnect');
                        that.message.text(msg, {timeout: 8000});

                        setTimeout(function forcedReconnectPartTwo() {
                            gateway_instance.set('kiwi_server', serv);

                            gateway_instance.reconnect(function() {
                                // Reconnect all the IRC connections
                                that.connections.forEach(function(con){ con.reconnect(); });
                            });
                        }, 5000);

                    }, jump_server_interval * 1000);
                }
            });


            gw.on('kiwi:asset_files_changes', function () {
                that.view.reloadStyles();
            });
        }

    }, {
        instance: function() {
            return instance;
        }
    });

    return Application;
});
