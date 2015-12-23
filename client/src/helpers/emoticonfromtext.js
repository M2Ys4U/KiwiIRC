define('helpers/emoticonfromtext', function () {

    function pushEmoticon(words_out, alt, emote_name) {
        words_out.push('<i class="emoticon ' + emote_name + '">' + alt + '</i>');
    }

    return function emoticonFromText(str) {
        var words_in = str.split(' '),
            words_out = [],
            i;

        for (i = 0; i < words_in.length; i++) {
            switch(words_in[i]) {
            case ':)':
                pushEmoticon(words_out, ':)', 'smile');
                break;
            case ':(':
                pushEmoticon(words_out, ':(', 'sad');
                break;
            case ':3':
                pushEmoticon(words_out, ':3', 'lion');
                break;
            case ';3':
                pushEmoticon(words_out, ';3', 'winky_lion');
                break;
            case ':s':
            case ':S':
                pushEmoticon(words_out, ':s', 'confused');
                break;
            case ';(':
            case ';_;':
                pushEmoticon(words_out, ';(', 'cry');
                break;
            case ';)':
                pushEmoticon(words_out, ';)', 'wink');
                break;
            case ';D':
                pushEmoticon(words_out, ';D', 'wink_happy');
                break;
            case ':P':
            case ':p':
                pushEmoticon(words_out, ':P', 'tongue');
                break;
            case 'xP':
                pushEmoticon(words_out, 'xP', 'cringe_tongue');
                break;
            case ':o':
            case ':O':
            case ':0':
                pushEmoticon(words_out, ':o', 'shocked');
                break;
            case ':D':
                pushEmoticon(words_out, ':D', 'happy');
                break;
            case '^^':
            case '^.^':
                pushEmoticon(words_out, '^^,', 'eyebrows');
                break;
            case '&lt;3':
                pushEmoticon(words_out, '<3', 'heart');
                break;
            case '&gt;_&lt;':
            case '&gt;.&lt;':
                pushEmoticon(words_out, '>_<', 'doh');
                break;
            case 'XD':
            case 'xD':
                pushEmoticon(words_out, 'xD', 'big_grin');
                break;
            case 'o.0':
            case 'o.O':
                pushEmoticon(words_out, 'o.0', 'wide_eye_right');
                break;
            case '0.o':
            case 'O.o':
                pushEmoticon(words_out, '0.o', 'wide_eye_left');
                break;
            case ':\\':
            case '=\\':
            case ':/':
            case '=/':
                pushEmoticon(words_out, ':\\', 'unsure');
                break;
            default:
                words_out.push(words_in[i]);
            }
        }

        return words_out.join(' ');
    };
});
