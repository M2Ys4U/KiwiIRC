define('ui/panels/applet_view', ['ui/panels/panel_view'], function (PanelView) {
    return PanelView.extend({
        className: 'panel applet',
        initialize: function (options) {
            this.initializePanel(options);
        }
    });
});
