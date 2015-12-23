define('ui/messagelist', ['lib/backbone', 'ui/messagelist/messages', 'ui/mediamessage'], function (Backbone, Messages, MediaMessage) {
    return Backbone.View.extend({
        className: 'messages',

        events: {
            'mouseenter .msg .nick': 'msgEnter',
            'mouseleave .msg .nick': 'msgLeave',
            'click .media .open': 'mediaClick'
        },

        initialize: function(opts) {
            var options = opts || {};

            this.messages = new Messages();
            this.listenTo(this.messages, 'add', function(message) {
                this.$el.append(message.view.render().$el);
            });

            // Passing in a memberlist lets nicks be clickable
            if (options.memberlist) {
                this.messages.memberlist = options.memberlist;
            }

            // Passing in a network lets channels be clickable
            if (options.network) {
                this.messages.network = options.network;
            }
        },

        render: function() {
            this.$el.empty();
            this.messages.forEach(function(message) {
                this.$el.append(message.view.render().$el);
            }, this);

            return this;
        },

        updateLastSeenMarker: function() {
            // Remove the previous last seen classes
            this.$('.last-seen').removeClass('last_seen');

            // Mark the last message the user saw
            this.messages.at(this.messages.length-1).view.$el.addClass('last-seen');
        },

        // Scroll to the bottom of the panel
        scrollToBottom: function (force_down) {
            var $last = this.$(':last');

            // No message at all? No need to scroll down
            if ($last.length === 0) {
                return;
            }

            // Don't scroll down if we're scrolled up the panel a little
            if (force_down || this.$el.scrollTop() + this.$el.height() > ($last.position().top + $last.outerHeight()) - 150) {
                this.el.scrollTop = this.el.scrollHeight;
            }
        },

        // Cursor hovers over a message
        msgEnter: function (event) {
            var nick_class;

            // Find a valid class that this element has
            _.each($(event.currentTarget).parent('.msg').attr('class').split(' '), function (css_class) {
                if (css_class.match(/^nick_[a-z0-9]+/i)) {
                    nick_class = css_class;
                }
            });

            // If no class was found..
            if (!nick_class) {
                return;
            }

            $('.'+nick_class).addClass('global-nick-highlight');
        },

        // Cursor leaves message
        msgLeave: function (event) {
            var nick_class;

            // Find a valid class that this element has
            _.each($(event.currentTarget).parent('.msg').attr('class').split(' '), function (css_class) {
                if (css_class.match(/^nick_[a-z0-9]+/i)) {
                    nick_class = css_class;
                }
            });

            // If no class was found..
            if (!nick_class) {
                return;
            }

            $('.'+nick_class).removeClass('global-nick-highlight');
        },

        mediaClick: function (event) {
            var $media = $(event.target).parents('.media');
            var media_message;

            if ($media.data('media')) {
                media_message = $media.data('media');
            } else {
                media_message = new MediaMessage({el: $media[0]});

                // Cache this MediaMessage instance for when it's opened again
                $media.data('media', media_message);
            }

            media_message.toggle();
        }
    });
});
