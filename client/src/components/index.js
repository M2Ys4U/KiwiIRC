define('components', ['components/event', 'components/network', 'components/controlinput', 'ui/panels/applet', 'ui/panels/panel', 'ui/menubox', 'misc/datastore', 'ui/notification', 'helpers/events'], function (EventComponent, network, control_input, AppletPanel, Panel, MenuBox, DataStore, Notification, events) {
    var Network, ControlInput;

    function init(Application) {
        Network = network.init(Application);
        ControlInput = control_input.init(Application);
    }

    function Events() {
        return events.createProxy();
    }

    return {
        init: init,
        EventComponent: EventComponent,
        AppletPanel: AppletPanel,
        Panel: Panel,
        MenuBox: MenuBox,
        DataStore: DataStore,
        Notification: Notification,
        Events: Events,
        get Network() { return Network; },
        get ControlInput() { return ControlInput; }
    };
});
