define('helpers/theme', function () {
    var text_theme;

    function setTextTheme(theme) {
        text_theme = theme;
    }

    function getTextTheme() {
        return text_theme;
    }

    return {
        setTextTheme: setTextTheme,
        getTextTheme: getTextTheme
    };
});
