define('ui/panels/server', ['ui/panels/channel', 'ui/messagelist', 'ui/panels/channel_view', 'helpers/events'], function (Channel, MessageList, ChannelView, events) {
    return Channel.extend({
        initialize: function () {
            var name = "Server",
                messages = new MessageList({network: this.get('network')});
            
            this.set({
                "messages": messages,
                "name": name
            }, {"silent": true});

            this.view = new ChannelView({"model": this, "name": name});
            events.emit('panel:created', {panel: this});
        },

        isServer: function () {
            return true;
        },

        isChannel: function () {
            return false;
        }
    });
});
