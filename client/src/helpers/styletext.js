define('helpers/styletext', ['helpers/theme', 'helpers/formattoircmessage'], function (theme, formatToIrcMsg) {
    /**
     * Simplyfy the text styling syntax
     *
     * Syntax:
     *   %nick:     nickname
     *   %channel:  channel
     *   %ident:    ident
     *   %host:     host
     *   %realname: realname
     *   %text:     translated text
     *   %C[digit]: color
     *   %B:        bold
     *   %I:        italic
     *   %U:        underline
     *   %O:        cancel styles
     **/
   return function styleText(string_id, params) {
        var style, text;

        //style = formatToIrcMsg(application.text_theme[string_id]);
        style = theme.getTextTheme()[string_id];
        style = formatToIrcMsg(style);

        // Expand a member mask into its individual parts (nick, ident, hostname)
        if (params.member) {
            params.nick = params.member.nick || '';
            params.ident = params.member.ident || '';
            params.host = params.member.hostname || '';
            params.prefix = params.member.prefix || '';
        }

        // Do the magic. Use the %shorthand syntax to produce output.
        text = style.replace(/%([A-Z]{2,})/ig, function(match, key) {
            if (typeof params[key] !== 'undefined') {
                return params[key];
            }
        });

        return text;
    };
});
