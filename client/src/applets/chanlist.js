define('applets/chanlist', ['lib/backbone', 'helpers/utils', 'ui/panels/applet', 'applets/chanlist_view', 'helpers/translator', 'helpers/formatircmsg', 'components'], function (Backbone, utils, AppletPanel, ChanListView, translator, formatIRCMsg, components) {
    var Applet = Backbone.Model.extend({
        initialize: function () {
            this.set('title', translator.translateText('client_applets_chanlist_channellist'));
            this.view = new ChanListView();

            this.network = components.Network();
            this.network.on('list_channel', this.onListChannel, this);
            this.network.on('list_start', this.onListStart, this);
        },

        // New channels to add to our list
        onListChannel: function (event) {
            this.addChannel(event.chans);
        },

        // A new, fresh channel list starting
        onListStart: function () {
            this.view.reset();
        },

        addChannel: function (channels) {
            var that = this;

            if (!_.isArray(channels)) {
                channels = [channels];
            }
            _.each(channels, function (chan) {
                var row;
                row = document.createElement("tr");
                row.innerHTML = '<td class="chanlist_name"><a class="chan" data-channel="' + chan.channel + '">' + _.escape(chan.channel) + '</a></td><td class="chanlist_num_users" style="text-align: center;">' + chan.num_users + '</td><td style="padding-left: 2em;" class="chanlist_topic">' + formatIRCMsg(_.escape(chan.topic)) + '</td>';
                chan.dom = row;
                that.view.channels.push(chan);
            });

            if (!that.view.waiting) {
                that.view.waiting = true;
                _.defer(function () {
                    that.view.render();
                    that.view.waiting = false;
                });
            }
        },

        dispose: function () {
            this.view.channels = null;
            this.view.unbind();
            this.view.$el.html('');
            this.view.remove();
            this.view = null;

            // Remove any network event bindings
            this.network.off();
        }
    });

    AppletPanel.register('kiwi_chanlist', Applet);

    return Applet;
});
