define('helpers/randomstring', function () {

    /**
    *   Generate a random string of given length
    *   @param      {Number}    string_length   The length of the random string
    *   @returns    {String}                    The random string
    */
    return function randomString(string_length) {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
            randomstring = '',
            i,
            rnum;
        for (i = 0; i < string_length; i++) {
            rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }
        return randomstring;
    };
});
