define('helpers/secondstotime', function () {
    /**
    *   Convert seconds into hours:minutes:seconds
    *   @param      {Number}    secs    The number of seconds to converts
    *   @returns    {Object}            An object representing the hours/minutes/second conversion of secs
    */
    return function secondsToTime(secs) {
        var hours, minutes, seconds, divisor_for_minutes, divisor_for_seconds, obj;
        hours = Math.floor(secs / (60 * 60));

        divisor_for_minutes = secs % (60 * 60);
        minutes = Math.floor(divisor_for_minutes / 60);

        divisor_for_seconds = divisor_for_minutes % 60;
        seconds = Math.ceil(divisor_for_seconds);

        obj = {
            "h": hours,
            "m": minutes,
            "s": seconds
        };
        return obj;
    };
});
