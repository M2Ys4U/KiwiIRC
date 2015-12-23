define('applets/settings', ['lib/backbone', 'ui/application', 'helpers/translator', 'utils/notifications', 'ui/panels/applet', 'applets/settings_view'], function (Backbone, Application, translator, notifications, AppletPanel, SettingsView) {
    var Applet = Backbone.Model.extend({
        initialize: function () {
            this.set('title', translator.translateText('client_applets_settings_title'));
            this.view = new SettingsView();
        }
    });


    AppletPanel.register('kiwi_settings', Applet);

    return Applet;
});
