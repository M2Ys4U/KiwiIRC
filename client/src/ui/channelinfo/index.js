define('ui/channelinfo', ['lib/backbone', 'ui/channelinfo/view'], function (Backbone, ChannelInfoView) {
    return Backbone.Model.extend({
        initialize: function () {
            this.view = new ChannelInfoView({"model": this});
        }
    });
});
