define('applets/settings_view', ['lib/backbone', 'ui/application', 'helpers/translator', 'utils/notifications', 'helpers/settings'], function (Backbone, Appliation, translator, notifications, settings) {
    return Backbone.View.extend({
        events: {
            'change [data-setting]': 'saveSettings',
            'click [data-setting="theme"]': 'selectTheme',
            'click .register-protocol': 'registerProtocol',
            'click .enable-notifications': 'enableNotifications',
            'click .show-category': 'onClickShowCategory'
        },

        initialize: function () {
            var application = Appliation.instance();

            var text = {
                messages              : translator.translateText('client_applets_settings_messages'),
                chat_messages         : translator.translateText('client_applets_settings_chat_messages'),
                alerts_notifications  : translator.translateText('client_applets_settings_alerts_notifications'),
                appearance            : translator.translateText('client_applets_settings_appearance'),
                theme                 : translator.translateText('client_applets_settings_theme'),
                channels              : translator.translateText('client_applets_settings_channels'),
                tabs                  : translator.translateText('client_applets_settings_channelview_tabs'),
                list                  : translator.translateText('client_applets_settings_channelview_list'),
                large_amounts_of_chans: translator.translateText('client_applets_settings_channelview_list_notice'),
                language              : translator.translateText('client_applets_settings_language'),
                join_part             : translator.translateText('client_applets_settings_notification_joinpart'),
                count_all_activity    : translator.translateText('client_applets_settings_notification_count_all_activity'),
                timestamps            : translator.translateText('client_applets_settings_timestamp'),
                timestamp_24          : translator.translateText('client_applets_settings_timestamp_24_hour'),
                mute                  : translator.translateText('client_applets_settings_notification_sound'),
                emoticons             : translator.translateText('client_applets_settings_emoticons'),
                queries               : translator.translateText('client_applets_settings_ignore_new_queries'),
                scroll_history        : translator.translateText('client_applets_settings_history_length'),
                languages             : translator.getTranslations(),
                default_client        : translator.translateText('client_applets_settings_default_client'),
                make_default          : translator.translateText('client_applets_settings_default_client_enable'),
                locale_restart_needed : translator.translateText('client_applets_settings_locale_restart_needed'),
                default_note          : translator.translateText('client_applets_settings_default_client_notice', '<a href="chrome://settings/handlers">chrome://settings/handlers</a>'),
                html5_notifications   : translator.translateText('client_applets_settings_html5_notifications'),
                enable_notifications  : translator.translateText('client_applets_settings_enable_notifications'),
                custom_highlights     : translator.translateText('client_applets_settings_custom_highlights'),
                autocomplete_slideout : translator.translateText('client_applets_settings_autocomplete_slideout'),
                theme_thumbnails: _.map(application.themes, function (theme) {
                    return _.template($('#tmpl_theme_thumbnail').html().trim())(theme);
                })
            };
            this.$el = $(_.template($('#tmpl_applet_settings').html().trim())(text));

            if (!navigator.registerProtocolHandler) {
                this.$('.protocol-handler').remove();
            }

            if (notifications.allowed() !== null) {
                this.$('.notification-enabler').remove();
            }

            // Incase any settings change while we have this open, update them
            settings.on('change', this.loadSettings, this);

            // Now actually show the first cetegory of settings
            this.showCategory('appearance');

        },

        loadSettings: function () {

            _.each(settings.attributes, function(value, key) {

                var $el = this.$('[data-setting="' + key + '"]');

                // Only deal with settings we have a UI element for
                if (!$el.length) {
                    return;
                }

                switch ($el.prop('type')) {
                    case 'checkbox':
                        $el.prop('checked', value);
                        break;
                    case 'radio':
                        this.$('[data-setting="' + key + '"][value="' + value + '"]').prop('checked', true);
                        break;
                    case 'text':
                        $el.val(value);
                        break;
                    case 'select-one':
                        this.$('[value="' + value + '"]').prop('selected', true);
                        break;
                    default:
                        this.$('[data-setting="' + key + '"][data-value="' + value + '"]').addClass('active');
                        break;
                }
            }, this);
        },

        saveSettings: function (event) {
            var value,
                $setting = $(event.currentTarget);

            switch (event.currentTarget.type) {
                case 'checkbox':
                    value = $setting.is(':checked');
                    break;
                case 'radio':
                case 'text':
                    value = $setting.val();
                    break;
                case 'select-one':
                    value = $(event.currentTarget[$setting.prop('selectedIndex')]).val();
                    break;
                default:
                    value = $setting.data('value');
                    break;
            }

            settings.set($setting.data('setting'), value);
            settings.saveOne($setting.data('setting'));
        },

        selectTheme: function(event) {
            event.preventDefault();

            this.$('[data-setting="theme"].active').removeClass('active');
            $(event.currentTarget).addClass('active').trigger('change');
        },

        registerProtocol: function (event) {
            event.preventDefault();

            var application = Appliation.instance();

            navigator.registerProtocolHandler('irc', document.location.origin + application.get('base_path') + '/%s', 'Kiwi IRC');
            navigator.registerProtocolHandler('ircs', document.location.origin + application.get('base_path') + '/%s', 'Kiwi IRC');
        },

        enableNotifications: function(event){
            event.preventDefault();

            notifications.requestPermission().always(_.bind(function () {
                if (notifications.allowed() !== null) {
                    this.$('.notification-enabler').remove();
                }
            }, this));
        },


        showCategory: function(category) {
            this.$('.settings-category').removeClass('active');
            this.$('.settings-category-' + category).addClass('active');

            this.$('.show-category').removeClass('active');
            this.$('.show-category-' + category).addClass('active');

            // Load the current settings
            this.loadSettings();
        },


        onClickShowCategory: function(event) {
            var category = $(event.currentTarget).data('category');
            if (category) {
                this.showCategory(category);
            }
        }

    });
});
