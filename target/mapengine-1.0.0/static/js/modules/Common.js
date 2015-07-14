/* Static low-level common methods module */

magic.modules.Common = function() {

    return({
        
        /* Taken from OL2 Util.js */
        inches_per_unit: {
            "inches": 1.0,
            "ft": 12.0,
            "miles": 63360.0,
            "m": 39.37,
            "km": 39370,
            "dd": 4374754,
            "yd": 36,
            "nm": 1852 * 39.37
        },
        
        /**
         * Convert date value assumed in format <source> to <dest>
         * @param {string} value
         * @param {string} source (d-m-Y|Y-m-d)
         * @param {type} dest (Y-m-d|d-m-Y)
         * @returns {string} the date formatted according to dest
         */
        dateFormat: function(value, source, dest) {
            var formattedValue = "Bad date : " + value;
            var dateParts = value.split(/[^\d]/);
            if (dateParts.length == 3) {
                if (source != dest) {
                    var dd, mm, yyyy;
                    if (source == "d-m-Y") {
                        dd = dateParts[0].length == 1 ? "0" + dateParts[0] : dateParts[0];
                        mm = dateParts[1].length == 1 ? "0" + dateParts[1] : dateParts[1];
                        yyyy = dateParts[2];
                        formattedValue = yyyy + "-" + mm + "-" + dd;
                    } else {
                        yyyy = dateParts[0];
                        mm = dateParts[1].length == 1 ? "0" + dateParts[1] : dateParts[1];
                        dd = dateParts[2].length == 1 ? "0" + dateParts[2] : dateParts[2];
                        formattedValue = dd + "-" + mm + "-" + yyyy;
                    }
                } else {
                    formattedValue = value;
                }
            }
            return(formattedValue);
        },       
        
        /**
         * Replace urls in given value by links
         * Courtesy of http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
         * @param {type} value
         * @returns {String}
         */
        linkify: function(value) {

            if (!value) {
                return("");
            }

            /* http://, https://, ftp:// */
            var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

            /* www. sans http:// or https:// */
            var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

            /* Email addresses */
            var emailAddressPattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim;

            return(value
                    .replace(urlPattern, '<a href="$&" title="$&" target="_blank">[external resource]</a>')
                    .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
                    .replace(emailAddressPattern, '<a href="mailto:$&">$&</a>')
                    );
        },
        
        /**
         * Break long string every 'size' characters with a <br />
         * @param {string} str
         * @param {int} size
         * @returns {string}
         */
        chunk: function(str, size) {
            if (typeof size == "undefined") {
                size = 2;
            }
            return(str.match(RegExp('.{1,' + size + '}', 'g')).join("<br />"));
        },
        
        /**
         * Break a string longer than size characters at the final space before the size limit (if possible)
         * @param {string} str
         * @param {int} size
         */
        ellipsis: function(str, size) {
            if (str.length <= size) {
                return(str);
            }
            var out = str.substr(0, size),
                lastSp = out.lastIndexOf(" ");
            if (lastSp == -1 || lastSp < size/2) {
                /* No space, or too near the beginning to be informative */
                out = out.substr(0, size-3) + "...";
            } else {
                out = out.substr(0, lastSp) + "...";
            }
            return(out);
        },
        
        /**
         * For multiline labelling - http://stackoverflow.com/questions/14484787/wrap-text-in-javascript
         * @param {type} string
         * @param {int} width
         * @param {string} spaceReplacer
         * @returns {string}
         */
        stringDivider: function(str, width, spaceReplacer) {
            if (str.length > width) {
                var p = width;
                for (; p > 0 && (str[p] != " " && str[p] != "-"); p--) {
                }
                if (p > 0) {
                    var left;
                    if (str.substring(p, p + 1) == "-") {
                        left = str.substring(0, p + 1);
                    } else {
                        left = str.substring(0, p);
                    }
                    var right = str.substring(p + 1);
                    return(left + spaceReplacer + stringDivider(right, width, spaceReplacer));
                }
            }
            return(str);
        },
        
        /**
         * Capitalise the first letter of the string
         * @param {string} str
         * @returns {string}
         */
        initCap: function(str) {
            return(str.substring(0, 1).toUpperCase() + str.substring(1));
        },
        
        /**
         * 
         * @param {string} str
         * @param {string} suffix
         * @returns {boolean}
         */
        endsWith: function(str, suffix) {
            return(str.indexOf(suffix, str.length - suffix.length) !== -1);
        },
        
        /**
         * Do unit conversion for length and area units
         * @param {float} value
         * @param {string} from units e.g. km for lengths, km2 for areas etc
         * @param {string} to units e.g. miles for lengths, miles2 for areas etc
         * @returns {String}
         */
        unitConverter: function(value, from, to) {
            var converted = 0.0, fromUnits = from, toUnits = to, order = 1;
            if (from.indexOf("2") == from.length - 1) {
                fromUnits = from.substring(0, from.length - 1);
                order = 2;
            }
            if (to.indexOf("2") == to.length - 1) {
                toUnits = to.substring(0, to.length - 1);
            }
            if (fromUnits in this.inches_per_unit && toUnits in this.inches_per_unit && (order == 1 || order == 2)) {
                converted = value * Math.pow(this.inches_per_unit[fromUnits] / this.inches_per_unit[toUnits], order);
                converted = converted.toFixed(3) + " " + toUnits + (order == 2 ? "<sup>2</sup>" : "");
            }
            return(converted);
        },
        
        /**
         * Degrees to radians
         * @param {float} degs
         * @returns {float}
         */
        toRadians: function(degs) {
            return(degs * Math.PI / 180.0);
        },
        
        /**
         * Radians to degrees
         * @param {float} rads
         * @returns {float}
         */
        toDegrees: function(rads) {
            return(rads * 180.0 / Math.PI);
        },
        
        /**
         * Are two floating point numbers equal to within a supplied tolerance?
         * @param {float} num
         * @param {float} value
         * @param {float} resolution
         * @returns {Boolean}
         */
        floatsEqual: function(num, value, resolution) {
            return(Math.abs(num - value) <= resolution);
        },
        
        /**
         * Is a floating point number within specified range (including a tolerance at the ends)
         * @param {float} num
         * @param {float} rangeLo
         * @param {float} rangeHi
         * @param {float} resolution
         * @returns {Boolean}
         */
        floatInRange: function(num, rangeLo, rangeHi, resolution) {
            return(
                    (num > rangeLo || Math.abs(num - rangeLo) <= resolution) &&
                    (num < rangeHi || Math.abs(num - rangeHi) <= resolution)
                    );
        }

    });

}();