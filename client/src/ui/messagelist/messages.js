define('ui/messagelist/messages', ['lib/backbone', 'ui/messagelist/message', 'helpers/settings'], function (Backbone, Message, settings) {
    return Backbone.Collection.extend({
        model: Message,
        comparator: 'date',

        initialize: function() {
            this.max_size = (parseInt(settings.get('scrollback'), 10) || 250);

            this.bind('add', function(new_model) {
                // Make sure we don't go over our scrollback size
                if (this.length > this.max_size) {
                    this.shift();
                }

                new_model.messages = this;
                new_model.memberlist = this.memberlist;
                new_model.network = this.network;
            }, this);

            // If set, nicks become clickable
            this.memberlist = null;

            // If set, channels become clickable
            this.network = null;
        }
    });
});
