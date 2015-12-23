define('helpers/formatircmsg', function () {

    var colourMatchRegex = /^\x03(([0-9][0-9]?)(,([0-9][0-9]?))?)/;

    function spanFromOpen(openTags) {
        var style = '',
            colours;
        if (!(openTags.bold || openTags.italic || openTags.underline || openTags.colour)) {
            return '';
        } else {
            style += (openTags.bold) ? 'font-weight: bold; ' : '';
            style += (openTags.italic) ? 'font-style: italic; ' : '';
            style += (openTags.underline) ? 'text-decoration: underline; ' : '';
            if (openTags.colour) {
                colours = openTags.colour.split(',');
                style += 'color: ' + colours[0] + ((colours[1]) ? '; background-color: ' + colours[1] + ';' : '');
            }
            return '<span class="format_span" style="' + style + '">';
        }
    }

    function colourMatch(str) {
        return colourMatchRegex.exec(str);
    }

    function hexFromNum(num) {
        switch (parseInt(num, 10)) {
        case 0:
            return '#FFFFFF';
        case 1:
            return '#000000';
        case 2:
            return '#000080';
        case 3:
            return '#008000';
        case 4:
            return '#FF0000';
        case 5:
            return '#800040';
        case 6:
            return '#800080';
        case 7:
            return '#FF8040';
        case 8:
            return '#FFFF00';
        case 9:
            return '#80FF00';
        case 10:
            return '#008080';
        case 11:
            return '#00FFFF';
        case 12:
            return '#0000FF';
        case 13:
            return '#FF55FF';
        case 14:
            return '#808080';
        case 15:
            return '#C0C0C0';
        default:
            return null;
        }
    }

    /**
    *   Formats a message. Adds bold, underline and colouring
    *   @param      {String}    msg The message to format
    *   @returns    {String}        The HTML formatted message
    */
    return function formatIRCMsg (msg) {
        "use strict";
        var out = '',
            currentTag = '',
            openTags = {
                bold: false,
                italic: false,
                underline: false,
                colour: false
            },
            i = 0,
            colours = [],
            match;

        for (i = 0; i < msg.length; i++) {
            switch (msg[i]) {
            case '\x02':
                if ((openTags.bold || openTags.italic || openTags.underline || openTags.colour)) {
                    out += currentTag + '</span>';
                }
                openTags.bold = !openTags.bold;
                currentTag = spanFromOpen(openTags);
                break;
            case '\x1D':
                if ((openTags.bold || openTags.italic || openTags.underline || openTags.colour)) {
                    out += currentTag + '</span>';
                }
                openTags.italic = !openTags.italic;
                currentTag = spanFromOpen(openTags);
                break;
            case '\x1F':
                if ((openTags.bold || openTags.italic || openTags.underline || openTags.colour)) {
                    out += currentTag + '</span>';
                }
                openTags.underline = !openTags.underline;
                currentTag = spanFromOpen(openTags);
                break;
            case '\x03':
                if ((openTags.bold || openTags.italic || openTags.underline || openTags.colour)) {
                    out += currentTag + '</span>';
                }
                match = colourMatch(msg.substr(i, 6));
                if (match) {
                    i += match[1].length;
                    // 2 & 4
                    colours[0] = hexFromNum(match[2]);
                    if (match[4]) {
                        colours[1] = hexFromNum(match[4]);
                    }
                    openTags.colour = colours.join(',');
                } else {
                    openTags.colour = false;
                }
                currentTag = spanFromOpen(openTags);
                break;
            case '\x0F':
                if ((openTags.bold || openTags.italic || openTags.underline || openTags.colour)) {
                    out += currentTag + '</span>';
                }
                openTags.bold = openTags.italic = openTags.underline = openTags.colour = false;
                break;
            default:
                if ((openTags.bold || openTags.italic || openTags.underline || openTags.colour)) {
                    currentTag += msg[i];
                } else {
                    out += msg[i];
                }
                break;
            }
        }
        if ((openTags.bold || openTags.italic || openTags.underline || openTags.colour)) {
            out += currentTag + '</span>';
        }
        return out;
    };
});
