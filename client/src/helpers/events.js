define('helpers/events', ['helpers/plugininterface'], function (PluginInterface) {
    var plugin_interface;

    function init() {
        plugin_interface = new PluginInterface();
    }

    function emit() {
        plugin_interface.emit.apply(plugin_interface, [].slice.call(arguments));
    }

    function on() {
        plugin_interface.on.apply(plugin_interface, [].slice.call(arguments));
    }

    function once() {
        plugin_interface.once.apply(plugin_interface, [].slice.call(arguments));
    }

    function off() {
        plugin_interface.off.apply(plugin_interface, [].slice.call(arguments));
    }

    function getListeners() {
        plugin_interface.getListeners.apply(plugin_interface, [].slice.call(arguments));
    }

    function createProxy() {
        plugin_interface.createProxy.apply(plugin_interface, [].slice.call(arguments));
    }

    function dispose() {
        plugin_interface.dispose.apply(plugin_interface, [].slice.call(arguments));
    }

    return {
        init: init,
        emit: emit,
        on: on,
        once: once,
        off: off,
        getListeners: getListeners,
        createProxy: createProxy,
        dispose: dispose
    };
});
