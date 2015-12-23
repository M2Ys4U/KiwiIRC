define('components/network', ['lib/lodash', 'components/event', 'misc/gateway'], function (_, EventComponent, Gateway) {
    var Application;

    function init(app) {
        Application = app;
        return Network;
    }
    
    function Network(connection_id) {
        var app = Application.instance(),
            connection_event;

        // If no connection id given, use all connections
        if (typeof connection_id !== 'undefined') {
            connection_event = 'connection:' + connection_id.toString();
        } else {
            connection_event = 'connection';
        }

        // Helper to get the network object
        var getNetwork = function() {
            var network = typeof connection_id === 'undefined' ?
                app.connections.active_connection :
                app.connections.getByConnectionId(connection_id);

            return network ?
                network :
                undefined;
        };

        // Create the return object (events proxy from the gateway)
        var obj = new EventComponent(Gateway.instance(), connection_event);

        // Proxy several gateway functions onto the return object
        var funcs = {
            kiwi: 'kiwi', raw: 'raw', kick: 'kick', topic: 'topic',
            part: 'part', join: 'join', action: 'action', ctcp: 'ctcp',
            ctcpRequest: 'ctcpRequest', ctcpResponse: 'ctcpResponse',
            notice: 'notice', msg: 'privmsg', say: 'privmsg',
            changeNick: 'changeNick', channelInfo: 'channelInfo',
            mode: 'mode', quit: 'quit'
        };

        _.each(funcs, function(gateway_fn, func_name) {
            obj[func_name] = function() {
                var fn_name = gateway_fn,
                    gateway_instance = Gateway.instance();

                // Add connection_id to the argument list
                var args = Array.prototype.slice.call(arguments, 0);
                args.unshift(connection_id);

                // Call the gateway function on behalf of this connection
                return gateway_instance[fn_name].apply(gateway_instance, args);
            };
        });

        // Now for some network related functions...
        obj.createQuery = function(nick) {
            var network;

            network = getNetwork();
            if (!network) {
                return;
            }

            return network.createQuery(nick);
        };

        obj.ignoreMask = function(mask) {
            var network = getNetwork();
            if (!network) {
                return;
            }

            return network.ignore_list.addMask(mask);
        };

        obj.unignoreMask = function(mask) {
            var network = getNetwork();
            if (!network) {
                return;
            }

            return network.ignore_list.removeMask(mask);
        };

        // Add the networks getters/setters
        obj.get = function(name) {
            var network, restricted_keys;

            network = getNetwork();
            if (!network) {
                return;
            }

            restricted_keys = [
                'password'
            ];
            if (restricted_keys.indexOf(name) > -1) {
                return undefined;
            }

            return network.get(name);
        };

        obj.set = function() {
            var network = getNetwork();
            if (!network) {
                return;
            }

            return network.set.apply(network, arguments);
        };

        return obj;
    }

    return {
        init: init
    };
});
