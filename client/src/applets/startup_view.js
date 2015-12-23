define('applets/startup_view', ['lib/backbone', 'ui/newconnection'], function (Backbone, NewConnection) {
    return Backbone.View.extend({
        events: {},

        initialize: function () {
            this.showConnectionDialog();
        },

        showConnectionDialog: function() {
            var connection_dialog = this.connection_dialog = new NewConnection();
            connection_dialog.populateDefaultServerSettings();

            connection_dialog.view.$el.addClass('initial');
            this.$el.append(connection_dialog.view.$el);

            var $info = $($('#tmpl_new_connection_info').html().trim());

            if ($info.html()) {
                connection_dialog.view.infoBoxSet($info);
            } else {
                $info = null;
            }

            this.listenTo(connection_dialog, 'connected', this.newConnectionConnected);

            _.defer(function(){
                if ($info) {
                    connection_dialog.view.infoBoxShow();
                }

                // Only set focus if we're not within an iframe. (firefox auto scrolls to the embedded client on page load - bad)
                if (window === window.top) {
                    connection_dialog.view.$el.find('.nick').select();
                }
            });
        },

        newConnectionConnected: function() {
            // Once connected, reset the connection form to be used again in future
            this.connection_dialog.view.reset();
        }
    });
});
