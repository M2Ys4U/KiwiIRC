define('ui/messagelist/message', ['lib/backbone', 'ui/messagelist/message_view'], function (Backbone, View) {
    return Backbone.Model.extend({
        initialize: function() {
            this.view = new View({model: this});
        }
    });
});
