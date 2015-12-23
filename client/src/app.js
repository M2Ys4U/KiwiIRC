define('app',
    ['lib/lodash', 'helpers/shims', 'ui/mediamessage', 'ui/application', 'misc/pluginmanager', 'helpers/translator', 'helpers/settings', 'helpers/events', 'components', 'misc/gateway'],
    function (_, shims, MediaMessage, Application, PluginManager, translate, settings, events, components, Gateway) {

    var _kiwi = {};

    var server_settings, base_path;

    _kiwi.applets = {};


    /**
     * A global container for third party access
     * Will be used to access a limited subset of kiwi functionality
     * and data (think: plugins)
     */
    _kiwi.global = {
        build_version: '',  // Kiwi IRC version this is built from (Set from index.html)
        plugins: undefined,

        addMediaMessageType: function(match, buildHtml) {
            MediaMessage.addType(match, buildHtml);
        },

        // Entry point to start the kiwi application
        init: function (opts, callback) {
            var locale_promise, theme_promise;

            opts = opts || {};

            // Set up the settings datastore
            settings.init('kiwi.settings');

            server_settings = opts.server_settings;
            base_path = opts.base_path;

            // Set the window title
            window.document.title = opts.server_settings.client.window_title || 'Kiwi IRC';

            locale_promise = new Promise(function (resolve) {
                // In order, find a locale from the users saved settings, the URL, default settings on the server, or auto detect
                var locale = settings.get('locale') || opts.locale || opts.server_settings.client.settings.locale || 'magic';
                $.getJSON(opts.base_path + '/assets/locales/' + locale + '.json', function (locale) {
                    translate.init(locale);
                    resolve();
                });
            });

            theme_promise = new Promise(function (resolve) {
                var text_theme = opts.server_settings.client.settings.text_theme || 'default';
                $.getJSON(opts.base_path + '/assets/text_themes/' + text_theme + '.json', function(text_theme) {
                    opts.text_theme = text_theme;
                    resolve();
                });
            });


            Promise.all([locale_promise, theme_promise]).then(function () {
                _kiwi.app = new (Application)(opts, _kiwi.build_version);

                components.init(_kiwi.app);

                // Start the client up
                _kiwi.app.initializeInterfaces();

                // Event emitter to let plugins interface with parts of kiwi
                events.init();

                // Now everything has started up, load the plugin manager for third party plugins
                _kiwi.global.plugins = new PluginManager();

                callback();

            }).then(null, function(err) {
                console.error(err);
                console.error(err.stack);
            });
        },

        start: function() {
            var app = Application.instance();
            app.showStartup();
        },

        // Allow plugins to change the startup applet
        registerStartupApplet: function(startup_applet_name) {
            var app = Application.instance();
            app.startup_applet_name = startup_applet_name;
        },

        /**
         * Open a new IRC connection
         * @param {Object} connection_details {nick, host, port, ssl, password, options}
         * @param {Function} callback function(err, network){}
         */
        newIrcConnection: function(connection_details, callback) {
           Gateway.instance().newConnection(connection_details, callback);
        },


        /**
         * Taking settings from the server and URL, extract the default server/channel/nick settings
         */
        defaultServerSettings: function () {
            var parts;
            var defaults = {
                nick: '',
                server: '',
                port: 6667,
                ssl: false,
                channel: '',
                channel_key: ''
            };
            var uricheck;


            /**
             * Get any settings set by the server
             * These settings may be changed in the server selection dialog or via URL parameters
             */
            if (server_settings.client) {
                if (server_settings.client.nick) {
                    defaults.nick = server_settings.client.nick;
                }

                if (server_settings.client.server) {
                    defaults.server = server_settings.client.server;
                }

                if (server_settings.client.port) {
                    defaults.port = server_settings.client.port;
                }

                if (server_settings.client.ssl) {
                    defaults.ssl = server_settings.client.ssl;
                }

                if (server_settings.client.channel) {
                    defaults.channel = server_settings.client.channel;
                }

                if (server_settings.client.channel_key) {
                    defaults.channel_key = server_settings.client.channel_key;
                }
            }



            /**
             * Get any settings passed in the URL
             * These settings may be changed in the server selection dialog
             */

            // Any query parameters first
            if (getQueryVariable('nick')) {
                defaults.nick = getQueryVariable('nick');
            }

            if (window.location.hash) {
                defaults.channel = window.location.hash;
            }


            // Process the URL part by part, extracting as we go
            parts = window.location.pathname.toString().replace(base_path, '').split('/');

            if (parts.length > 0) {
                parts.shift();

                if (parts.length > 0 && parts[0]) {
                    // Check to see if we're dealing with an irc: uri, or whether we need to extract the server/channel info from the HTTP URL path.
                    uricheck = parts[0].substr(0, 7).toLowerCase();
                    if ((uricheck === 'ircs%3a') || (uricheck.substr(0,6) === 'irc%3a')) {
                        parts[0] = decodeURIComponent(parts[0]);
                        // irc[s]://<host>[:<port>]/[<channel>[?<password>]]
                        uricheck = /^irc(s)?:(?:\/\/?)?([^:\/]+)(?::([0-9]+))?(?:(?:\/)([^\?]*)(?:(?:\?)(.*))?)?$/.exec(parts[0]);
                        /*
                            uricheck[1] = ssl (optional)
                            uricheck[2] = host
                            uricheck[3] = port (optional)
                            uricheck[4] = channel (optional)
                            uricheck[5] = channel key (optional, channel must also be set)
                        */
                        if (uricheck) {
                            if (typeof uricheck[1] !== 'undefined') {
                                defaults.ssl = true;
                                if (defaults.port === 6667) {
                                    defaults.port = 6697;
                                }
                            }
                            defaults.server = uricheck[2];
                            if (typeof uricheck[3] !== 'undefined') {
                                defaults.port = uricheck[3];
                            }
                            if (typeof uricheck[4] !== 'undefined') {
                                defaults.channel = '#' + uricheck[4];
                                if (typeof uricheck[5] !== 'undefined') {
                                    defaults.channel_key = uricheck[5];
                                }
                            }
                        }
                        parts = [];
                    } else {
                        // Extract the port+ssl if we find one
                        if (parts[0].search(/:/) > 0) {
                            defaults.port = parts[0].substring(parts[0].search(/:/) + 1);
                            defaults.server = parts[0].substring(0, parts[0].search(/:/));
                            if (defaults.port[0] === '+') {
                                defaults.port = parseInt(defaults.port.substring(1), 10);
                                defaults.ssl = true;
                            } else {
                                defaults.ssl = false;
                            }

                        } else {
                            defaults.server = parts[0];
                        }

                        parts.shift();
                    }
                }

                if (parts.length > 0 && parts[0]) {
                    defaults.channel = '#' + parts[0];
                    parts.shift();
                }
            }

            // If any settings have been given by the server.. override any auto detected settings
            /**
             * Get any server restrictions as set in the server config
             * These settings can not be changed in the server selection dialog
             */
            if (server_settings && server_settings.connection) {
                if (server_settings.connection.server) {
                    defaults.server = server_settings.connection.server;
                }

                if (server_settings.connection.port) {
                    defaults.port = server_settings.connection.port;
                }

                if (server_settings.connection.ssl) {
                    defaults.ssl = server_settings.connection.ssl;
                }
            }

            // Set any random numbers if needed
            defaults.nick = defaults.nick.replace(/\?/g, Math.floor(Math.random() * 100000).toString());

            if (getQueryVariable('encoding')) {
                defaults.encoding = getQueryVariable('encoding');
            }

            return defaults;
        },
    };

    window['kiwi'] = _kiwi.global; //jshint ignore:line

    return _kiwi.global;

});
