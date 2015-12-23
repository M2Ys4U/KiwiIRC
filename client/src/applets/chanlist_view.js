define('applets/chanlist_view', ['lib/lodash', 'lib/backbone', 'helpers/translator', 'misc/gateway'], function (_, Backbone, translator, Gateway) {
    return Backbone.View.extend({
        events: {
            "click .chan": "chanClick",
            "click .channel-name-title": "sortChannelsByNameClick",
            "click .users_title": "sortChannelsByUsersClick"
        },

        initialize: function () {
            var text = {
                channel_name: translator.translateText('client_applets_chanlist_channelname'),
                users: translator.translateText('client_applets_chanlist_users'),
                topic: translator.translateText('client_applets_chanlist_topic')
            };
            this.$el = $(_.template($('#tmpl_channel_list').html().trim())(text));

            this.channels = [];

            // Sort the table
            this.order = '';

            // Waiting to add the table back into the DOM?
            this.waiting = false;
        },

        render: function () {
            var table = $('table', this.$el),
                tbody = table.children('tbody:first').detach(),
                i;

            // Create the sort icon container and clean previous any previous ones
            if($('.applet-chanlist .users_title').find('span.chanlist_sort_users').length === 0) {
                this.$('.users_title').append('<span class="chanlist_sort_users">&nbsp;&nbsp;</span>');
            } else {
                this.$('.users_title span.chanlist_sort_users').removeClass('fa fa-sort-desc');
                this.$('.users_title span.chanlist_sort_users').removeClass('fa fa-sort-asc');
            }
            if ($('.applet-chanlist .channel-name-title').find('span.chanlist_sort_names').length === 0) {
                this.$('.channel-name-title').append('<span class="chanlist_sort_names">&nbsp;&nbsp;</span>');
            } else {
                this.$('.channel-name-title span.chanlist_sort_names').removeClass('fa fa-sort-desc');
                this.$('.channel-name-title span.chanlist_sort_names').removeClass('fa fa-sort-asc');
            }

            // Push the new sort icon
            switch (this.order) {
                default:
                case 'user_desc':
                    this.$('.users_title span.chanlist_sort_users').addClass('fa fa-sort-asc');
                    break;
                case 'user_asc':
                    this.$('.users_title span.chanlist_sort_users').addClass('fa fa-sort-desc');
                    break;
                case 'name_asc':
                    this.$('.channel-name-title span.chanlist_sort_names').addClass('fa fa-sort-desc');
                    break;
                case 'name_desc':
                    this.$('.channel-name-title span.chanlist_sort_names').addClass('fa fa-sort-asc');
                    break;
            }

            this.channels = this.sortChannels(this.channels, this.order);

            // Make sure all the channel DOM nodes are inserted in order
            for (i = 0; i < this.channels.length; i++) {
                tbody[0].appendChild(this.channels[i].dom);
            }

            table[0].appendChild(tbody[0]);
        },


        reset: function() {
            this.$('tbody').empty();
            this.channels = [];
            this.order = '';
            this.waiting = false;
        },


        chanClick: function (event) {
            if (event.target) {
                Gateway.instance().join(null, $(event.target).data('channel'));
            } else {
                // IE...
                Gateway.instance().join(null, $(event.srcElement).data('channel'));
            }
        },

        sortChannelsByNameClick: function () {
            // Revert the sorting to switch between orders
            this.order = (this.order === 'name_asc') ? 'name_desc' : 'name_asc';

            this.sortChannelsClick();
        },

        sortChannelsByUsersClick: function () {
            // Revert the sorting to switch between orders
            this.order = (this.order === 'user_desc' || this.order === '') ? 'user_asc' : 'user_desc';

            this.sortChannelsClick();
        },

        sortChannelsClick: function() {
            this.render();
        },

        sortChannels: function (channels, order) {
            var sort_channels = [],
                new_channels = [];


            // First we create a light copy of the channels object to do the sorting
            _.each(channels, function (chan, chan_idx) {
                sort_channels.push({'chan_idx': chan_idx, 'num_users': chan.num_users, 'channel': chan.channel});
            });

            // Second, we apply the sorting
            sort_channels.sort(function (a, b) {
                switch (order) {
                    case 'user_asc':
                        return a.num_users - b.num_users;
                    case 'user_desc':
                        return b.num_users - a.num_users;
                    case 'name_asc':
                        if (a.channel.toLowerCase() > b.channel.toLowerCase()) {
                            return 1;
                        }
                        if (a.channel.toLowerCase() < b.channel.toLowerCase()) {
                            return -1;
                        }
                        break;
                    case 'name_desc':
                        if (a.channel.toLowerCase() < b.channel.toLowerCase()) {
                            return 1;
                        }
                        if (a.channel.toLowerCase() > b.channel.toLowerCase()) {
                            return -1;
                        }
                        break;
                    default:
                        return b.num_users - a.num_users;
                }
                return 0;
            });

            // Third, we re-shuffle the chanlist according to the sort order
            _.each(sort_channels, function (chan) {
                new_channels.push(channels[chan.chan_idx]);
            });

            return new_channels;
        }
    });
});