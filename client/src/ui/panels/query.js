define('ui/panels/query', ['ui/panels/channel', 'ui/messagelist', 'ui/panels/channel_view', 'helpers/events'], function (Channel, MessageList, ChannelView, events) {
    return Channel.extend({
        initialize: function () {
            var name = this.get("name") || "",
                messages;

            messages = new MessageList({
                network: this.get('network')   // Enables clicking on channels
            });

            this.set({
                "name": name,
                "messages": messages
            }, {"silent": true});

            this.view = new ChannelView({"model": this, "name": name});

            events.emit('panel:created', {panel: this});
        },

        isChannel: function () {
            return false;
        },

        isQuery: function () {
            return true;
        }
    });
});
