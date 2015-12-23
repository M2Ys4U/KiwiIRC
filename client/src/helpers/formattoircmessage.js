define('helpers/formattoircmessage', function () {
    return function formatToIrcMsg(message) {
        // Format any colour codes (eg. $c4)
        message = message.replace(/%C(\d)/g, function(match, colour_number) {
            return String.fromCharCode(3) + colour_number.toString();
        });

        var formatters = {
            B: '\x02',    // Bold
            I: '\x1D',    // Italics
            U: '\x1F',    // Underline
            O: '\x0F'     // Out / Clear formatting
        };
        message = message.replace(/%([BIUO])/g, function(match, format_code) {
            if (typeof formatters[format_code.toUpperCase()] !== 'undefined') {
                return formatters[format_code.toUpperCase()];
            }
        });

        return message;
    };
});
