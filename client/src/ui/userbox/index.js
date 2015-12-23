define('ui/userbox', ['lib/backbone', 'ui/application', 'helpers/translator', 'helpers/tousermask'], function (Backbone, Application, translator, toUserMask) {
    return Backbone.View.extend({
        events: {
            'click .query': 'queryClick',
            'click .info': 'infoClick',
            'change .ignore': 'ignoreChange',
            'click .ignore': 'ignoreClick',
            'click .op': 'opClick',
            'click .deop': 'deopClick',
            'click .voice': 'voiceClick',
            'click .devoice': 'devoiceClick',
            'click .kick': 'kickClick',
            'click .ban': 'banClick'
        },

        initialize: function () {
            var text = {
                op: translator.translateText('client_views_userbox_op'),
                de_op: translator.translateText('client_views_userbox_deop'),
                voice: translator.translateText('client_views_userbox_voice'),
                de_voice: translator.translateText('client_views_userbox_devoice'),
                kick: translator.translateText('client_views_userbox_kick'),
                ban: translator.translateText('client_views_userbox_ban'),
                message: translator.translateText('client_views_userbox_query'),
                info: translator.translateText('client_views_userbox_whois'),
                ignore: translator.translateText('client_views_userbox_ignore')
            };
            this.$el = $(_.template($('#tmpl_userbox').html().trim())(text));
        },

        setTargets: function (user, channel) {
            this.user = user;
            this.channel = channel;

            var user_mask = toUserMask(this.user.get('nick')),
                is_ignored = Application.instance().connections.active_connection.isUserIgnored(user_mask);

            this.$('.ignore input').attr('checked', is_ignored ? 'checked' : false);
        },

        displayOpItems: function(display_items) {
            if (display_items) {
                this.$el.find('.if-op').css('display', 'block');
            } else {
                this.$el.find('.if-op').css('display', 'none');
            }
        },

        queryClick: function () {
            var nick = this.user.get('nick');
            Application.instance().connections.active_connection.createQuery(nick);
        },

        infoClick: function () {
            Application.instance().controlbox.processInput('/whois ' + this.user.get('nick'));
        },

        ignoreClick: function (event) {
            // Stop the menubox from closing since it will not update the checkbox otherwise
            event.stopPropagation();
        },

        ignoreChange: function (event) {
            if ($(event.currentTarget).find('input').is(':checked')) {
                Application.instance().controlbox.processInput('/ignore ' + this.user.get('nick'));
            } else {
                Application.instance().controlbox.processInput('/unignore ' + this.user.get('nick'));
            }
        },

        opClick: function () {
            Application.instance().controlbox.processInput('/mode ' + this.channel.get('name') + ' +o ' + this.user.get('nick'));
        },

        deopClick: function () {
            Application.instance().controlbox.processInput('/mode ' + this.channel.get('name') + ' -o ' + this.user.get('nick'));
        },

        voiceClick: function () {
            Application.instance().controlbox.processInput('/mode ' + this.channel.get('name') + ' +v ' + this.user.get('nick'));
        },

        devoiceClick: function () {
            Application.instance().controlbox.processInput('/mode ' + this.channel.get('name') + ' -v ' + this.user.get('nick'));
        },

        kickClick: function () {
            // TODO: Enable the use of a custom kick message
            Application.instance().controlbox.processInput('/kick ' + this.user.get('nick') + ' Bye!');
        },

        banClick: function () {
            // TODO: Set ban on host, not just on nick
            Application.instance().controlbox.processInput('/mode ' + this.channel.get('name') + ' +b ' + this.user.get('nick') + '!*');
        }
    });
});
