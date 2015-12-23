define('helpers/settings', ['misc/datastore'], function (DataStore) {
    var data_store,
        default_settings;

    function init(instance, defaults) {
        default_settings = defaults;
        data_store = DataStore.instance(instance);
        data_store.load();
    }

    function get() {
        data_store.get.apply(data_store, [].slice.call(arguments));
    }

    function set() {
        data_store.set.apply(data_store, [].slice.call(arguments));
    }

    function save() {
        data_store.save.apply(data_store, [].slice.call(arguments));
    }

    function on() {
        data_store.on.apply(data_store, [].slice.call(arguments));
    }

    return {
        init: init,
        get: get,
        set: set,
        save: save,
        on: on,
        get attributes() {
            return data_store.attributes;
        }
    };
});
