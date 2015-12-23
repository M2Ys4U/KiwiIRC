define('components/controlinput', ['lib/lodash', 'components/event'], function (_, EventComponent) {
    var Application;

    function init(app) {
        Application = app;
        return ControlInput;
    }

    function ControlInput() {
        var app = Application.instance();
        var obj = new EventComponent(app.controlbox);
        var funcs = {
            run: 'processInput', addPluginIcon: 'addPluginIcon'
        };

        _.each(funcs, function(controlbox_fn, func_name) {
            obj[func_name] = function() {
                var fn_name = controlbox_fn;
                return app.controlbox[fn_name].apply(app.controlbox, arguments);
            };
        });

        // Give access to the control input textarea
        obj.input = app.controlbox.$('.inp');

        return obj;
    }

    return {
        init: init
    };
});
