define('helpers/formatdate', ['helpers/translator'], function (translator) {
    return (function() {
        /*
        Modified version of date.format.js
        https://github.com/jacwright/date.format
        */
        var locale_init = false, // Once the loales have been loaded, this is set to true
            shortMonths, longMonths, shortDays, longDays;

        // defining patterns
        var replaceChars = {
            // Day
            d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
            D: function() { return Date.shortDays[this.getDay()]; },
            j: function() { return this.getDate(); },
            l: function() { return Date.longDays[this.getDay()]; },
            N: function() { return this.getDay() + 1; },
            S: function() { return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th'))); },
            w: function() { return this.getDay(); },
            z: function() { var d = new Date(this.getFullYear(),0,1); return Math.ceil((this - d) / 86400000); }, // Fixed now
            // Week
            W: function() { var d = new Date(this.getFullYear(), 0, 1); return Math.ceil((((this - d) / 86400000) + d.getDay() + 1) / 7); }, // Fixed now
            // Month
            F: function() { return Date.longMonths[this.getMonth()]; },
            m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
            M: function() { return Date.shortMonths[this.getMonth()]; },
            n: function() { return this.getMonth() + 1; },
            t: function() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate(); }, // Fixed now, gets #days of date
            // Year
            L: function() { var year = this.getFullYear(); return (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)); },   // Fixed now
            o: function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
            Y: function() { return this.getFullYear(); },
            y: function() { return ('' + this.getFullYear()).substr(2); },
            // Time
            a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
            A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
            B: function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
            g: function() { return this.getHours() % 12 || 12; },
            G: function() { return this.getHours(); },
            h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
            H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
            i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
            s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
            u: function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ? '0' : '')) + m; },
            // Timezone
            e: function() { return "Not Yet Supported"; },
            I: function() {
                var DST = null;
                    for (var i = 0; i < 12; ++i) {
                            var d = new Date(this.getFullYear(), i, 1);
                            var offset = d.getTimezoneOffset();

                            if (DST === null) DST = offset;
                            else if (offset < DST) { DST = offset; break; }
                            else if (offset > DST) break;
                    }
                    return (this.getTimezoneOffset() == DST) | 0;
                },
            O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
            P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00'; }, // Fixed now
            T: function() { var m = this.getMonth(); this.setMonth(0); var result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); this.setMonth(m); return result;},
            Z: function() { return -this.getTimezoneOffset() * 60; },
            // Full Date/Time
            c: function() { return this.format("Y-m-d\\TH:i:sP"); }, // Fixed now
            r: function() { return this.toString(); },
            U: function() { return this.getTime() / 1000; }
        };


        var initLocaleFormats = function() {
            shortMonths = [
                translator.translateText('client.libs.date_format.short_months.january'),
                translator.translateText('client.libs.date_format.short_months.february'),
                translator.translateText('client.libs.date_format.short_months.march'),
                translator.translateText('client.libs.date_format.short_months.april'),
                translator.translateText('client.libs.date_format.short_months.may'),
                translator.translateText('client.libs.date_format.short_months.june'),
                translator.translateText('client.libs.date_format.short_months.july'),
                translator.translateText('client.libs.date_format.short_months.august'),
                translator.translateText('client.libs.date_format.short_months.september'),
                translator.translateText('client.libs.date_format.short_months.october'),
                translator.translateText('client.libs.date_format.short_months.november'),
                translator.translateText('client.libs.date_format.short_months.december')
            ];
            longMonths = [
                translator.translateText('client.libs.date_format.long_months.january'),
                translator.translateText('client.libs.date_format.long_months.february'),
                translator.translateText('client.libs.date_format.long_months.march'),
                translator.translateText('client.libs.date_format.long_months.april'),
                translator.translateText('client.libs.date_format.long_months.may'),
                translator.translateText('client.libs.date_format.long_months.june'),
                translator.translateText('client.libs.date_format.long_months.july'),
                translator.translateText('client.libs.date_format.long_months.august'),
                translator.translateText('client.libs.date_format.long_months.september'),
                translator.translateText('client.libs.date_format.long_months.october'),
                translator.translateText('client.libs.date_format.long_months.november'),
                translator.translateText('client.libs.date_format.long_months.december')
            ];
            shortDays = [
                translator.translateText('client.libs.date_format.short_days.monday'),
                translator.translateText('client.libs.date_format.short_days.tuesday'),
                translator.translateText('client.libs.date_format.short_days.wednesday'),
                translator.translateText('client.libs.date_format.short_days.thursday'),
                translator.translateText('client.libs.date_format.short_days.friday'),
                translator.translateText('client.libs.date_format.short_days.saturday'),
                translator.translateText('client.libs.date_format.short_days.sunday')
            ];
            longDays = [
                translator.translateText('client.libs.date_format.long_days.monday'),
                translator.translateText('client.libs.date_format.long_days.tuesday'),
                translator.translateText('client.libs.date_format.long_days.wednesday'),
                translator.translateText('client.libs.date_format.long_days.thursday'),
                translator.translateText('client.libs.date_format.long_days.friday'),
                translator.translateText('client.libs.date_format.long_days.saturday'),
                translator.translateText('client.libs.date_format.long_days.sunday')
            ];

            locale_init = true;
        };
        /* End of date.format */


        // Finally.. the actuall formatDate function
        return function(working_date, format) {
            if (!locale_init) {
                initLocaleFormats();
            }

            working_date = working_date || new Date();
            format = format || translator.translateText('client_date_format');

            return format.replace(/(\\?)(.)/g, function(_, esc, chr) {
                return (esc === '' && replaceChars[chr]) ? replaceChars[chr].call(working_date) : chr;
            });
        };
    })();
});
