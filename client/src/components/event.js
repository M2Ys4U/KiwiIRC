define('components/event', ['lib/lodash', 'lib/backbone'], function (_, Backbone) {

    /*
     * proxyEvent() listens for events then re-triggers them on its own
     * event emitter. Why? So we can .off() on this emitter without
     * effecting the source of events. Handy for plugins that we don't
     * trust meddling with the core events.
     *
     * If listening for 'all' events the arguments are as follows:
     *     1. Name of the triggered event
     *     2. The event data
     * For all other events, we only have one argument:
     *     1. The event data
     *
     * When this is used via `new kiwi.components.Network()`, this listens
     * for 'all' events so the first argument is the event name which is
     * the connection ID. We don't want to re-trigger this event name so
     * we need to juggle the arguments to find the real event name we want
     * to emit.
     */
    function proxyEvent(proxy_event_name, event_name, event_data) {
        if (proxy_event_name !== 'all') {
            event_data = event_name.event_data;
            event_name = event_name.event_name;
        }

        this.trigger(event_name, event_data);
    }

    return function EventComponent(event_source, proxy_event_name) {

        // The event we are to proxy
        proxy_event_name = proxy_event_name || 'all';

        _.extend(this, Backbone.Events);
        this._source = event_source;

        // Proxy the events to this dispatcher
        event_source.on(proxy_event_name, proxyEvent, this);

        // Clean up this object
        this.dispose = function () {
            event_source.off(proxy_event_name, _.bind(proxyEvent, proxy_event_name));
            this.off();
            delete this.event_source;
        };
    };
});
