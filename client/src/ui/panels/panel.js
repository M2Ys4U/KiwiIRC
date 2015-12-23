define('ui/panels/panel', ['lib/backbone', 'ui/application', 'ui/panels/panel_view', 'helpers/events'], function (Backbone, Application, PanelView, events) {
    return Backbone.Model.extend({
        initialize: function () {
            var name = this.get("name") || "";
            this.view = new PanelView({"model": this, "name": name});
            this.set({
                "scrollback": [],
                "name": name
            }, {"silent": true});

            events.emit('panel:created', {panel: this});
        },

        close: function () {
            Application.instance().panels.trigger('close', this);
            events.emit('panel:close', {panel: this});

            if (this.view) {
                this.view.unbind();
                this.view.remove();
                this.view = undefined;
                delete this.view;
            }

            var members = this.get('members');
            if (members) {
                members.reset([]);
                this.unset('members');
            }

            this.get('panel_list').remove(this);

            this.unbind();
            this.destroy();
        },

        isChannel: function () {
            return false;
        },

        isQuery: function () {
            return false;
        },

        isApplet: function () {
            return false;
        },

        isServer: function () {
            return false;
        },

        isActive: function () {
            return (Application.instance().panels().active === this);
        }
    });
});
