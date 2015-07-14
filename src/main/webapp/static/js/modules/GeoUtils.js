/* Static geographic utilities module */

magic.modules.GeoUtils = function() {

    return({
        
        /* Distance apart in degrees that two angles have to be in order to be considered different */
        ANGULAR_TOLERANCE: 1e-03,
        
        /* Densification factor (generate this many intermediate points on a line prior to reprojection) */
        N_INTERP: 5,
        
        /* WGS84 ellipsoid */
        WGS84: new ol.Ellipsoid(6378137, 1 / 298.257223563),
        
        /**
         * Format a coordinate according to global preference
         * @param {float} coordinate
         * @param {string} pref
         * @param {int} dp
         * @returns {String}
         */
        formatCoordinate: function(coordinate, pref, dp) {
            var formattedValue = "";
            if (!dp && dp != 0) {
                dp = 4;
            }
            coordinate = parseFloat(coordinate).toFixed(dp);
            switch (pref) {
                case "dms":
                    formattedValue = this.toDMS(coordinate, "lon", "dms");
                    break;
                case "ddm":
                    formattedValue = this.toDDM(coordinate, "lon");
                    break;
                default:
                    formattedValue = coordinate;
                    break;
            }
            return(formattedValue);
        },
        
        /**
         * Format a latitude/longitude co-ordinate according to a DMS scheme
         * Taken from OpenLayers 2.13.1
         * @param {float} coordinate
         * @param {string} axis (lon|lat)
         * @param {string} dmsOption (dms|dm|d)
         * @returns {string}
         */
        toDMS: function(coordinate, axis, dmsOption) {

            dmsOption = dmsOption || "dms";
            /* Normalize for sphere being round */
            coordinate = (coordinate + 540) % 360 - 180;

            var absCoordinate = Math.abs(coordinate);
            var dd = Math.floor(absCoordinate);

            var mm = 60 * (absCoordinate - dd);
            var tempMm = mm;
            mm = Math.floor(mm);
            var ss = 60 * (tempMm - mm);
            ss = Math.round(ss * 10);
            ss /= 10;
            if (ss >= 60) {
                ss -= 60;
                mm++;
                if (mm >= 60) {
                    mm -= 60;
                    dd++;
                }
            }
            if (dd < 10) {
                dd = "0" + dd;
            }
            var str = dd + "\u00B0";

            if (dmsOption.indexOf("dm") >= 0) {
                if (mm < 10) {
                    mm = "0" + mm;
                }
                str += mm + "'";
                if (dmsOption.indexOf("dms") >= 0) {
                    if (ss < 10) {
                        ss = "0" + ss;
                    }
                    str += ss + '"';
                }
            }

            if (axis == "lon") {
                str += coordinate < 0 ? "W" : "E";
            } else {
                str += coordinate < 0 ? "S" : "N";
            }
            return(str);
        },
        
        /**
         * Format a latitude/longitude according to a degrees decimal minutes scheme
         * @param {float} coordinate
         * @param {string} axis
         * @returns {string}
         */
        toDDM: function(coordinate, axis) {
            var ddm = "";
            var dms = this.toDMS(coordinate, axis);
            var dmsParts = dms.split(/[^A-Za-z0-9.]/);
            if (dmsParts.length == 4) {
                var dmins = parseFloat(dmsParts[1]) + parseFloat(dmsParts[2] / 60.0);
                ddm = dmsParts[3] + dmsParts[0] + " " + (dmins.toFixed(3));
            }
            return(ddm);
        },
        
        /**
         * Take a co-ordinate value which might be in decimal degrees, DMS (dd mm ss.ssH) or degrees, decimal minutes, and convert to decimal degrees
         * @param {string} value
         * @return {float|NaN}
         */
        toDecDegrees: function(value) {
            var res = value;
            if (!$.isNumeric(value)) {
                /* Try DMS */
                res = Number.NaN;
                var cpts = value.split(/[^0-9EWSNewsn.]/);
                switch (cpts.length) {
                    case 3:
                        /* Potential DMS - dd mm ss.ssH */
                        var dd = (cpts[0].length == 1 || cpts[0].length == 2) ? parseFloat(cpts[0]) : Number.NaN;
                        var mm = (cpts[1].length == 1 || cpts[1].length == 2) ? parseFloat(cpts[1]) : Number.NaN;
                        var ss = parseFloat(cpts[2].substring(0, cpts[2].length - 1));
                        var hh = cpts[2].substring(cpts[2].length - 1, cpts[2].length).toUpperCase();
                        if (!isNaN(dd) && !isNaN(mm) && !isNaN(ss) && hh.length == 1 && hh.match(/NESW/)) {
                            res = dd + mm / 60.0 + ss / 3600.0;
                            if (hh == "S" || hh == "W") {
                                res *= -1.0;
                            }
                        }
                        break;
                    case 2:
                        /* Potential degrees, decimal minutes Hdd mm.mmmm */
                        var hh = cpts[0].substring(0, 1).toUpperCase();
                        var dd = cpts[0].substring(1);
                        var mm = parseFloat(cpts[1]);
                        if (dd.length >= 1 && dd.length <= 3 && !isNaN(parseFloat(dd)) && !isNaN(mm) && hh.length == 1 && hh.match(/NESW/)) {
                            res = parseFloat(dd) + mm / 60;
                            if (hh == "S" || hh == "W") {
                                res *= -1.0;
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
            return(isNaN(res) ? Number.NaN : parseFloat(res));
        },
        
        /**
         * Validate a co-ordinate value (lon/lat)
         * @param {string} value
         * @param {boolean} isLat
         * @param {boolean} allowBlank
         * @return boolean
         */
        validCoordinate: function (value, isLat, allowBlank) {
            var ok = false;
            if (!value && allowBlank) {
                ok = true;
            } else {
                var rangeLo = isLat ? -90.0 : -180.0;
                var rangeHi = isLat ? 90.0 : 180.0;
                var conversion = this.toDecDegrees(value);
                if (!isNaN(conversion)) {
                    ok = magic.modules.Common.floatInRange(conversion, rangeLo, rangeHi, 1e-08);
                }
            }
            return(ok);
        },
        
        /**
         * Check a hemisphere specification is one character and is N|S|E|W
         * @param {string} h
         * @return boolean
         */
        validHemisphere: function(h) {
            return(h.length == 1 && h.match(/NESWnesw/));
        },
           
        /**
         * Format an elevation value
         * @param {float} elevation
         * @param {string} pref
         * @param {int} dp
         * @returns {String}
         */
        formatElevation: function(elevation, pref, dp) {
            var formattedValue = "";
            if (!dp && dp != 0) {
                dp = 1;
            }
            elevation = parseFloat(elevation).toFixed(dp);
            switch (pref) {
                case "ft":
                    formattedValue = (elevation * 3.2808399).toFixed(dp) + "ft";
                    break;
                default:
                    formattedValue = elevation + "m";
                    break;
            }
            return(formattedValue);
        },
        
        /**
         * Format a bounding box received as [[x0, y0], [x1, y1]] or as a flat array
         * @param {Array} bbox
         * @param {int} dp
         * @returns {String}
         */
        formatBbox: function(bbox, dp) {
            if (!dp && dp != 0) {
                dp = 1;
            }
            var flattened = $.map(bbox, function(n) {return(n)}),
                captions = ["minx", "miny", "maxx", "maxy"],                       
                values = [];
            $.each(flattened, function(idx, item) {
                values.push(captions[idx] + " : " + parseFloat(item).toFixed(dp));
            });
            return(values.join("<br />"));
        },
        
        /**
         * Format a projection received as e.g. EPSG:3031
         * @param {string} proj
         * @returns {string}
         */
        formatProjection: function(proj) {
            var formattedValue = "";
            var code = proj.split(":").pop();
            if (!isNaN(parseInt(code)) && (code < 32768 || code == 102020)) {
                formattedValue = '<a href="http://epsg.io/?q=' + code + '" target="_blank">' + proj + '</a>';
            } else {
                formattedValue = proj;
            } 
            return(formattedValue);
        },
        
        /**
         * Detect if two longitudes representing a segment are equal and coincide with the dateline 
         * (+/- 180 to within tolerance)
         * @param {float} lon0
         * @param {float} lon1
         * @return {boolean}
         */
        alongDateline: function(lon0, lon1) {
            return(
                magic.modules.Common.floatsEqual(lon0, lon1, this.ANGULAR_TOLERANCE) &&
                (
                    magic.modules.Common.floatsEqual(lon0, -180.0, this.ANGULAR_TOLERANCE) ||
                    magic.modules.Common.floatsEqual(lon0, 180.0, this.ANGULAR_TOLERANCE)
                )
            );
        },
        
        /**
         * Detect if a segment crosses the dateline, assuming the given longitudes are to be interpreted
         * as increasing in the clockwise direction		 
         * @param {float} lon0
         * @param {float} lon1
         * @return {boolean}
         */
        crossesDateline: function(lon0, lon1) {
            return(lon0 > 0 && lon1 < 0 && !magic.modules.Common.floatsEqual(lon0, lon1, this.ANGULAR_TOLERANCE));
        },
        
        /**
         * Detect if two latitudes representing a segment are equal and coincide with the a pole (+/-90 to within tolerance)
         * @param {float} lat0
         * @param {float} lat1
         * @param {string} hemi N|S
         * @return {boolean}
         */
        atPole: function(lat0, lat1, hemi) {
            var poleLat = !hemi ? -90.0 : (hemi == "S" ? -90.0 : 90.0);
            return(
                magic.modules.Common.floatsEqual(lat0, lat1, this.ANGULAR_TOLERANCE) &&
                magic.modules.Common.floatsEqual(lat0, poleLat, this.ANGULAR_TOLERANCE)
            );
        },
        
        /**
         * Detect if longitudes are circumpolar 
         * @param {float} lon0
         * @param {float} lon1
         * @return {boolean}
         */
        isCircumpolar: function(lon0, lon1) {
            return(
                magic.modules.Common.floatsEqual(lon0, -180.0, this.ANGULAR_TOLERANCE) &&
                magic.modules.Common.floatsEqual(lon1, 180.0, this.ANGULAR_TOLERANCE)
            );
        },
        
        /**
         * Compute the minimum enclosing extent in projected co-ordinates of the given EPSG:4326 extent
         * Done by breaking the extent at the dateline if necessary, then densifying and reprojecting
         * @param {ol.extent} extent        
         * @return {ol.extent}
         */
        extentFromWgs84Extent: function(extent) {
            var bbox = [];
            var finalExtent = null;
            var lon0 = extent[0], lat0 = extent[1], lon1 = extent[2], lat1 = extent[3];
            var sourceProj = ol.proj.get("EPSG:4326");
            if (this.isCircumpolar(lon0, lon1)) {
                /* Pan-Antarctic request */
                var extPt = new ol.geom.Point([0, lat1]);
                extPt.transform(sourceProj, magic.runtime.projection);
                var ymax = extPt.getCoordinates()[1];
                finalExtent = [-ymax, -ymax, ymax, ymax];
            } else {
                if (this.crossesDateline(lon0, lon1)) {
                    /* Break bounding box at anti-meridian */
                    bbox.push([lon0, lat0, 180.0, lat1]);
                    bbox.push([-180.0, lat0, lon1, lat1]);
                } else {
                    bbox.push([lon0, lat0, lon1, lat1]);
                }
                for (var i = 0; i < bbox.length; i++) {
                    var densifiedPoly = this.densify(bbox[i]);
                    densifiedPoly.transform(sourceProj, magic.runtime.projection);                    
                    if (finalExtent == null) {
                        finalExtent = densifiedPoly.getExtent();
                    } else {
                        finalExtent.extend(densifiedPoly.getExtent());
                    }
                }
            }
            return(finalExtent);
        },
        
        /**
         * Create a polygon from the given box by interpolating points along each segment
         * @param {OpenLayers.Bounds} bbox
         * @return {OpenLayers.Geometry.Polygon}
         */
        densify: function(bbox) {
            var densPts = [];
            var pts = [
                [bbox[0], bbox[1]],
                [bbox[0], bbox[3]],
                [bbox[2], bbox[3]],
                [bbox[2], bbox[1]]
            ];
            for (var i = 0; i < pts.length; i++) {
                var nxti = (i+1) % 4,
                    xDiff = parseFloat(pts[nxti][0] - pts[i][0]), 
                    yDiff = parseFloat(pts[nxti][1] - pts[i][1]);
                for (var j = 0; j <= this.N_INTERP; j++) {
                    var proportion = parseFloat(j) / parseFloat(this.N_INTERP+1);
                    densPts.push([parseFloat(pts[i][0]) + proportion*xDiff, parseFloat(pts[i][1]) + proportion*yDiff]);
                }
            }
            return(new ol.geom.Polygon([densPts], "XY"));
        },
        
        /**
         * Get scale of map
         * https://groups.google.com/forum/#!searchin/ol3-dev/dpi/ol3-dev/RAJa4locqaM/4AzBrkndL9AJ
         * @param {ol.Map} map (defaults to magic.runtime.map)
         * @returns {float}
         */
        getCurrentMapScale: function(map) {
            map = map || magic.runtime.map;            
            var resolution = map ? map.getView().getResolution() : magic.runtime.view.resolutions[0];
            var units = map ? map.getView().getProjection().getUnits() : magic.runtime.projection.getUnits();
            var dpi = 25.4 / 0.28;
            var mpu = ol.proj.METERS_PER_UNIT[units];
            var scale = resolution * mpu * 39.37 * dpi; /* NB magic numbers */
            return(parseFloat(scale));
        }
    });

}();