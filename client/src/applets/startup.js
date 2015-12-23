define('applets/startup', ['lib/backbone', 'ui/panels/applet', 'applets/startup_view'], function (Backbone, AppletPanel, StartupView) {
    var Applet = Backbone.Model.extend({
        initialize: function () {
            this.view = new StartupView({model: this});
        }
    });

    AppletPanel.register('kiwi_startup', Applet);
});
