define('helpers/shims', function () {

    /**
    *   String.trim shim
    */
    if (typeof String.prototype.trim === 'undefined') {
        String.prototype.trim = function () { //jshint ignore:line
            return this.replace(/^\s+|\s+$/g, "");
        };
    }

    /**
    *   String.lpad shim
    *   @param      {Number}    length      The length of padding
    *   @param      {String}    characher   The character to pad with
    *   @returns    {String}                The padded string
    */
    if (typeof String.prototype.lpad === 'undefined') {
        String.prototype.lpad = function (length, character) { //jshint ignore:line
            var padding = "",
                i;
            for (i = 0; i < length; i++) {
                padding += character;
            }
            return (padding + this).slice(-length);
        };
    }

    /* Set or get the caret position or selection range of inputs and textareas */
    $.fn.selectRange = function(start, end) {
        var e = $(this)[0];
        if (!e) {
            return;
        }

        if (typeof start === 'undefined') {
            var caret_pos = 0;

            if (document.selection) {
                var sel = document.selection.createRange ();
                sel.moveStart ('character', -e.value.length);
                caret_pos = sel.text.length;
            } else if (e.selectionStart || e.selectionStart === '0') {
                caret_pos = e.selectionStart;
            }

            return caret_pos;

        } else {
            if (typeof end === 'undefined') {
                end = start;
            }

            // WebKit
            if (e.setSelectionRange) {
                e.focus();
                e.setSelectionRange(start, end);
            }
            // IE
            else if (e.createTextRange) {
                var range = e.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
            else if (e.selectionStart) {
                e.selectionStart = start;
                e.selectionEnd = end;
            }
        }
    };
});