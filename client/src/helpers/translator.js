define('helpers/settings', ['lib/jed'], function (Jed) {

    var translator, translations;

    function init(locale) {
        translator = new Jed(locale);
    }

    function translateText(string_id, params) {
        if (!translator) {
            init();
        }

        return translator.translate(string_id).fetch(params);
    }

    function setTranslations(trans) {
        translations = trans;
    }

    function getTranslations() {
        return translations;
    }

    return {
        init: init,
        translateText: translateText,
        setTranslations: setTranslations,
        getTranslations: getTranslations
    };
});
