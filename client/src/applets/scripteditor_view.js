define('applets/scripteditor_view', ['lib/backbone', 'ui/application', 'helpers/translator', 'helpers/settings'], function (Backbone, Application, translator, settings) {
    return Backbone.View.extend({
        events: {
            'click .btn-save': 'onSave'
        },

        initialize: function () {
            var that = this,
                app = Application.instance(),
                text = {
                    save: translator.translateText('client_applets_scripteditor_save')
                };
            this.$el = $(_.template($('#tmpl_script_editor').html().trim())(text));

            this.model.on('applet_loaded', function () {
                that.$el.parent().css('height', '100%');
                $script(app.get('base_path') + '/assets/libs/ace/ace.js', function (){ that.createAce(); });
            });
        },


        createAce: function () {
            var editor_id = 'editor_' + Math.floor(Math.random()*10000000).toString();
            this.editor_id = editor_id;

            this.$el.find('.editor').attr('id', editor_id);

            this.editor = ace.edit(editor_id);
            this.editor.setTheme("ace/theme/monokai");
            this.editor.getSession().setMode("ace/mode/javascript");

            var script_content = settings.get('user_script') || '';
            this.editor.setValue(script_content);
        },


        onSave: function () {
            var script_content, User_fn;

            // Build the user script up with some pre-defined components
            script_content = 'var network = kiwi.components.Network();\n';
            script_content += 'var input = kiwi.components.ControlInput();\n';
            script_content += 'var events = kiwi.components.Events();\n';
            script_content += this.editor.getValue() + '\n';

            // Add a dispose method to the user script for cleaning up
            script_content += 'this._dispose = function(){ network.off(); input.off(); events.dispose(); if(this.dispose) this.dispose(); }';

            // Try to compile the user script
            try {
                User_fn = new Function(script_content); //jshint ignore:line

                // Dispose any existing user script
                if (_kiwi.user_script && _kiwi.user_script._dispose) {
                    _kiwi.user_script._dispose();
                }

                // Create and run the new user script
                _kiwi.user_script = new User_fn();

            } catch (err) {
                this.setStatus(translator.translateText('client_applets_scripteditor_error', err.toString()));
                return;
            }

            // If we're this far, no errors occured. Save the user script
            settings.set('user_script', this.editor.getValue());
            settings.save();

            this.setStatus(translator.translateText('client_applets_scripteditor_saved') + ' :)');
        },


        setStatus: function (status_text) {
            var $status = this.$el.find('.toolbar .status');

            status_text = status_text || '';
            $status.slideUp('fast', function() {
                $status.text(status_text);
                $status.slideDown();
            });
        }
    });
});
