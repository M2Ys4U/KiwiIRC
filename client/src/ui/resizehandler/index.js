define('ui/resizehandler', ['lib/backbone', 'ui/application'], function (Backbone, Application) {
    return Backbone.View.extend({
        events: {
            'mousedown': 'startDrag',
            'mouseup': 'stopDrag'
        },

        initialize: function () {
            this.dragging = false;
            this.starting_width = {};

            $(window).on('mousemove', $.proxy(this.onDrag, this));
        },

        startDrag: function () {
            this.dragging = true;
        },

        stopDrag: function () {
            this.dragging = false;
        },

        onDrag: function (event) {
            if (!this.dragging) {
                return;
            }

            var offset = $('#kiwi').offset().left;

            this.$el.css('left', event.clientX - (this.$el.outerWidth(true) / 2) - offset);
            $('#kiwi .right-bar').css('width', this.$el.parent().width() - (this.$el.position().left + this.$el.outerWidth()));
            Application.instance().view.doLayout();
        }
    });
});
