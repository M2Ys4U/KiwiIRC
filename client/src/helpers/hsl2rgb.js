define('helpers/hsl2rgb', function () {

    function hueToRgb(m1, m2, hue) {
        var v;
        if (hue < 0) {
            hue += 1;
        }
        else if (hue > 1) {
            hue -= 1;
        }

        if (6 * hue < 1) {
            v = m1 + (m2 - m1) * hue * 6;
        }
        else if (2 * hue < 1) {
            v = m2;
        }
        else if (3 * hue < 2) {
            v = m1 + (m2 - m1) * (2/3 - hue) * 6;
        }
        else {
            v = m1;
        }

        return 255 * v;
    }

    return function hsl2rgb(h, s, l) {
        var m1, m2, hue;
        var r, g, b;
        
        s /=100;
        l /= 100;
        if (s === 0) {
            r = g = b = (l * 255);
        }
        else {
            if (l <= 0.5) {
                m2 = l * (s + 1);
            }
            else {
                m2 = l + s - l * s;
            }
            m1 = l * 2 - m2;
            hue = h / 360;
            r = hueToRgb(m1, m2, hue + 1/3);
            g = hueToRgb(m1, m2, hue);
            b = hueToRgb(m1, m2, hue - 1/3);
        }
        return [r,g,b];
    };

});