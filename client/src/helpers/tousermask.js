define('helpers/tousermask', function () {
    /*
    * Convert input to valid ignore regex.
    *   @param      {String}    host The user mask to format.
    *   @returns    {Array}          An array with the full user mask and regex.
    */
    return function toUserMask(inp, return_regex) {
        // Convert input to full user masks.
        var tmp = inp.match(/([^!@]+)!?([^!@]+)?@?(.+)?/),
            res = (tmp[1]||'*') + '!' + (tmp[2]||'*') + '@' + (tmp[3]||'*');

        // Return the generated user mask only if no_array is true.
        if (!return_regex) {
           return res;
        } else {
           // Return an array with the full user mask and RegEx.
           return [res, new RegExp('^'+res.toLowerCase().replace(/\./g,'\\.').replace(/\*/g,'(.[^!@]*?)')+'$','i')];
        }
    };
});
