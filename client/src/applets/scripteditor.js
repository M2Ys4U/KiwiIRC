define('applets/scripteditor', ['lib/backbone', 'ui/panels/applet', 'applets/scripteditor_view', 'helpers/translator'], function (Backbone, AppletPanel, ScriptEditorView, translator) {
    var Applet = Backbone.Model.extend({
        initialize: function () {
            this.set('title', translator.translateText('client_applets_scripteditor_title'));
            this.view = new ScriptEditorView({model: this});

        }
    });

    AppletPanel.register('kiwi_script_editor', Applet);

    return Applet;
});
