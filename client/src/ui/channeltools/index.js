define('ui/channeltools', ['lib/backbone', 'ui/application', 'ui/channelinfo'], function (Backbone, Application, ChannelInfo) {
    return Backbone.View.extend({
        events: {
            'click .channel-info': 'infoClick',
            'click .channel-part': 'partClick'
        },

        initialize: function () {},

        infoClick: function () {
            return new ChannelInfo({channel: Application.instance().panels().active});
        },

        partClick: function () {
            Application.instance().connections.active_connection.gateway.part(Application.instance().panels().active.get('name'));
        }
    });
});
