/* Static geographic utilities module */

magic.modules.GeoUtils = function() {

    return({
        
        /* Distance apart in degrees that two angles have to be in order to be considered different */
        ANGULAR_TOLERANCE: 1e-03,
        
        /* Densification factor (generate this many intermediate points on a line prior to reprojection) */
        N_INTERP: 5,
        
        /* WGS84 ellipsoid */
        WGS84: new ol.Sphere(6378137),
        
        /* Range of units for expressing distance */
        DISTANCE_UNITS: [
            ["km", "kilometres"],
            ["m", "metres"],
            ["mi", "statute miles"],
            ["nmi", "nautical miles"]
        ],

        /* Range of units for expressing areas */
        AREA_UNITS: [
            ["km", "square kilometres"],
            ["m", "square metres"],
            ["mi", "square miles"],
            ["nmi", "square nautical miles"]
        ],

        /* Range of units for expressing elevations */
        ELEVATION_UNITS: [
            ["m", "metres"],
            ["ft", "feet"]
        ],

        /* Supported co-ordinate formats */
        COORDINATE_FORMATS: [
            ["dd", "decimal degrees"],
            ["dms", "degrees, minutes and seconds"],
            ["ddm", "degrees, decimal minutes"]
        ],
        
        /* Default settings for geographical preferences */
        DEFAULT_GEO_PREFS: {
            distance: "km",
            area: "km",
            elevation: "m",
            coordinates: "dd"
        },
        
        /* Default map parameters for different regions */
        DEFAULT_MAP_PARAMS: {
            "antarctic": {
                "projection": "EPSG:3031",
                "proj_extent": [-5000000,-5000000,5000000,5000000],
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,                
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140, 56, 28, 14, 5.6, 2.8, 1.4, 0.56]
            },
            /* For CCAMLR */
            "antarctic_laea": {
                "projection": "EPSG:102020",
                "proj_extent": [-5500000,-5500000,5500000,5500000],
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,               
                "resolutions": [14000, 7000, 2800, 1400, 560, 280, 140]                
            },
            "arctic": {
                "projection": "EPSG:3995",
                "proj_extent": [-4000000,-4000000,4000000,4000000],
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,               
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140]
            }, 
            "southgeorgia":{
                "projection": "EPSG:3762",
                "proj_extent": [-929362.849,-1243855.108,1349814.294,556833.528],
                "center": [-1000.0, 61900.0],
                "zoom": 4,
                "rotation": 0,                
                "resolutions": [3360, 1680, 840, 420, 210, 105, 42, 21, 10.5, 4.2, 2.1, 1.12, 0.56, 0.28, 0.14]
            },
            "midlatitudes": {
                "projection": "EPSG:3857",  /* Spherical Mercator as per OSM/Google */
                "proj_extent": [-20026376.39, -20048966.10, 20026376.39, 20048966.10],
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,                
                "resolutions": []
            }
        },
        
        /**
         * Default layers for embedded maps of different regions
         * @param {String} region
         * @return {Object}
         */
        defaultEmbeddedLayers: function(region) {
            return(this.getBaseLayers(region).concat(this.getTopoLayers(region)));
        },
        
        /**
         * Default layers for different regions
         * @param {String} region
         * @return {Object}
         */
        defaultLayers: function(region) {
            if (region == "antarctic") {
                return([
                    {
                        "id": null,
                        "name": "Base layers",                        
                        "expanded": true,
                        "base": true,
                        "layers": this.getBaseLayers("antarctic")
                    },
                    {
                        "id": null,
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": this.getTopoLayers("antarctic")
                    }
                ]);
            } else if (region == "antarctic_laea") {
                return([
                    {
                        "id": null,
                        "name": "Base layers",                        
                        "expanded": true,
                        "base": true,
                        "layers": this.getBaseLayers("antarctic_laea")
                    },
                    {
                        "id": null,
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": this.getTopoLayers("antarctic_laea")
                    }
                ]);
            } else if (region == "arctic") {
                return([
                    {
                        "id": null,
                        "name": "Base layers",
                        "expanded": true,
                        "base": true,
                        "layers": this.getBaseLayers("arctic")
                    },
                    {
                        "id": null,
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": this.getTopoLayers("arctic")
                    }
                ]);
            } else if (region == "southgeorgia") {
                return([
                    {
                        "id": null,
                        "name": "Base layers",
                        "expanded": true,
                        "base": true,
                        "layers": this.getBaseLayers("southgeorgia")
                    },
                    {
                        "id": null,
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": this.getTopoLayers("southgeorgia")
                    }
                ]);
            } else if (region == "midlatitudes") {
                return(this.getBaseLayers("midlatitudes"));
            } else {
                return([]);
            }            
        },
        
        /**
         * Get array of base layer definitions for the supplied region
         * @param {String} region antarctic|antarctic_laea|arctic|southgeorgia|midlatitudes
         * @return {Array}
         */
        getBaseLayers: function(region) {
            if (region == "antarctic") {
                return ([
                    {
                        "id": null,
                        "name": "Hillshade and bathymetry",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                            "feature_name": "add:antarctic_hillshade_and_bathymetry",
                            "is_base": true
                        },
                        "is_visible": true
                    }
                ]);
            } else if (region == "antarctic_laea") {                
                return([
                    {
                        "id": null,
                        "name": "Hillshade and bathymetry",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("CCAMLR GIS"),
                            "feature_name": "gis:hillshade_and_bathymetry",
                            "is_base": true
                        },
                        "is_visible": true
                    }
                ]);
            } else if (region == "arctic") {
                return([
                    {
                        "id": null,
                        "name": "Hillshade and bathymetry",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                            "feature_name": "arctic:arctic_hillshade_and_bathymetry",
                            "is_base": true,
                            "is_dem": true
                        },  
                        "is_visible": true

                    }
                ]);
            } else if (region == "southgeorgia") {
                return([
                    {
                        "id": null,
                        "name": "Hillshade and bathymetry",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                            "feature_name": "sggis:sg_hillshade_and_bathymetry",
                            "is_base": true,
                            "is_dem": true
                        },                                   
                        "is_visible": true                                
                    }
                ]);
            } else if (region == "midlatitudes") {
                return([
                    magic.modules.Endpoints.getMidLatitudeCoastSource()
                ]);
            } else {             
                return([]);
            }
        },
        
        /**
         * Get array of topo layer definitions for the supplied region
         * @param {String} region antarctic|antarctic_laea|arctic|southgeorgia|midlatitudes
         * @return {Array}
         */
        getTopoLayers: function(region) {
            if (region == "antarctic") {
                return ([
                    {
                        "id": null,
                        "name": "Coastline",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                            "feature_name": "add:antarctic_coastline"
                        },     
                        "is_visible": true
                    },
                    {
                        "id": null,
                        "name": "Sub-Antarctic coastline",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                            "feature_name": "add:sub_antarctic_coastline"
                        },     
                        "is_visible": true
                    }
                ]);
            } else if (region == "antarctic_laea") {
                return([
                    {
                        "id": null,
                        "name": "Coastline",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("CCAMLR GIS"),
                            "feature_name": "gis:coastline"
                        },     
                        "is_visible": true
                    }
                ]);
            } else if (region == "arctic") {
                return([
                    {
                        "id": null,
                        "name": "Coastline",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                            "feature_name": "arctic:arctic_coastline"
                        },   
                        "is_visible": true
                    }
                ]);
            } else if (region == "southgeorgia") {
                return([
                    {
                        "id": null,
                        "name": "Coastline",
                        "source": {
                            "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                            "feature_name": "sggis:sg_coastline"
                        },   
                        "is_visible": true
                    }
                ]);
            } else {            
                return([]);
            }
        },
        
        /**
         * Format a lon/lat coordinate according to global preference
         * @param {float} coordinate
         * @param {string} destFormat (dms|ddm|dd)
         * @param {string} axis (lon|lat)
         * @param {int} dp
         * @returns {String}
         */
        formatCoordinate: function(coordinate, destFormat, axis, dp) {
            var formattedValue = null;
            if (!dp && dp != 0) {
                dp = 4;
            }                   
            if (this.validCoordinate(coordinate, axis == "lat", false)) {
                /* Quick sanity check that it's a sensible number passes */
                var dd = this.toDecDegrees(coordinate);
                if (!isNaN(dd)) {
                    dd = parseFloat(dd.toFixed(dp));
                    switch (destFormat) {
                        case "dms":
                            formattedValue = this.toDMS(dd, axis, "dms");
                            break;
                        case "ddm":
                            formattedValue = this.toDDM(dd, axis);
                            break;
                        default:
                            formattedValue = dd;
                            break;
                    }
                } else {
                    formattedValue = coordinate;
                }
            } else {
                formattedValue = coordinate;
            }
            return(formattedValue);
        },
        
        /**
         * Format a latitude/longitude co-ordinate according to a DMS scheme
         * @param {float} coordinate
         * @param {string} axis (lon|lat)
         * @returns {string}
         */
        toDMS: function(coordinate, axis) {
            var out = "";
            if (axis == "lon") {
                var sourceCoord = [coordinate, 0.1];
                var destCoord = ol.coordinate.toStringHDMS(sourceCoord);
                var divider = "N";
                out = destCoord.substring(destCoord.indexOf(divider)+2);
            } else {
                var sourceCoord = [0.0, coordinate];
                var destCoord = ol.coordinate.toStringHDMS(sourceCoord);
                var divider = coordinate < 0 ? "S" : "N";
                out = destCoord.substring(0, destCoord.indexOf(divider)+1);
            }
            return(out);
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
            var dmsParts = dms.split(/[^A-Za-z0-9.]+/);
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
            if (!jQuery.isNumeric(value)) {
                /* Try DMS */
                res = Number.NaN;
                value = value.trim().toUpperCase();
                var hh = "X";
                var dd = 0.0, mm = 0.0, ss = 0.0;
                var c1 = value.charAt(0), cn = value.charAt(value.length-1);
                if (c1 == "N" || c1 == "S" || c1 == "E" || c1 == "W") {
                    hh = c1;
                    value = value.substring(1);
                } else if (cn == "N" || cn == "S" || cn == "E" || cn == "W") {
                    hh = cn;
                    value = value.substring(0, value.length-1);
                }
                if (hh != "X") {
                    value = value.replace(/[^0-9.]{1,}/g, " ");
                    value = value.trim();
                    var parts = value.split(" ");
                    dd = parseFloat(parts[0]);
                    if (parts.length > 1) {
                        mm = parseFloat(parts[1]);
                    }
                    if (parts.length > 2) {
                        ss = parseFloat(parts[2]);
                    }
                    res = (dd + mm / 60.0 + ss / 3600.0) * ((hh == "S" || hh == "W") ? -1.0 : 1.0); 
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
            return(h.length == 1 && h.match(/N|E|S|W|n|e|s|w/));
        },
                          
        /**
         * Format a distance, area or elevation value
         * @param {float} value
         * @param {int} dims 1|2
         * @param {string} destFormat
         * @param {string} sourceFormat
         * @param {int} dp
         * @returns {String}
         */
        formatSpatial: function(value, dims, destFormat, sourceFormat, dp) {
            if (!jQuery.isNumeric) {
                return("");
            }
            if (!dp && dp != 0) {
                dp = 1;
            }
            var formattedValue = value;
            if (sourceFormat != destFormat) {
                var multipliers = {
                    "m": 1.0,
                    "ft": 3.2808399,
                    "km": 0.001,
                    "mi": 0.000621371192,
                    "nm": 0.000539956803
                };                
                value = parseFloat(value);
                if (sourceFormat != "m") {
                    /* Convert first to metres */
                    for (var i = 0; i < dims; i++) {
                        value *= 1/multipliers[sourceFormat];
                    }
                }
                /* Metres to destination format step */
                if (destFormat != "m") {
                    for (var i = 0; i < dims; i++) {
                        value *= multipliers[destFormat];
                    }
                }                
                formattedValue = value.toFixed(dp) + destFormat;           
            } else {
                formattedValue += destFormat;
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
            if (!bbox) {
                return("");
            }
            if (!dp && dp != 0) {
                dp = 1;
            }
            var flattened = jQuery.map(bbox, function(n) {return(n)}),
                captions = ["minx", "miny", "maxx", "maxy"],                       
                values = [];
            jQuery.each(flattened, function(idx, item) {
                values.push(captions[idx] + " : " + parseFloat(item).toFixed(dp));
            });
            return(values.join("<br>"));
        },
        
        /**
         * Create a suitable display extent from the given data extent (basically set a minimum size in case where the latter is very small)
         * @param {Array} dataExtent
         * @param {int} buffer size in metres
         * @returns {Array}
         */
        bufferExtent: function(dataExtent, buffer) {
            var extentOut = dataExtent.slice(0);
            var DEFAULT_BUFFER = 10000;
            buffer = buffer || DEFAULT_BUFFER;
            var dataCentroid = [0.5*(dataExtent[2] - dataExtent[0]), 0.5*(dataExtent[3] - dataExtent[1])];
            if (dataExtent[2] - dataExtent[0] < buffer) {
                extentOut[0] = dataCentroid[0] - 0.5*buffer;
                extentOut[2] = dataCentroid[0] + 0.5*buffer;
            }
            if (dataExtent[3] - dataExtent[1] < buffer) {
                extentOut[1] = dataCentroid[1] - 0.5*buffer;
                extentOut[3] = dataCentroid[1] + 0.5*buffer;
            }
            return(extentOut);
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
         * Apply unit preferences to a value
         * @param {string} name coordinates|distance|area|elevation
         * @param {string|double|int} value
         * @param {string} coord (lon|lat)
         * @param {string} setting value of the user's preference for the above                  
         * @param {string} sourceFormat to help conversion where the source format is unknown
         * @return {string|number}
         */
        applyPref: function(name, value, coord, setting, sourceFormat) {
            var out = value;
            if (!coord && name == "coordinates") {
                coord = "lon";
            }
            if (!setting) {
                setting = magic.runtime.preferences[name];
            }
            if (!sourceFormat && (name == "distance" || name == "area" || name == "elevation")) {
                sourceFormat = "m";
            }            
            switch(name) {
                case "coordinates":
                    out = this.formatCoordinate(value, setting, coord);
                    break;                
                case "distance":
                    out = this.formatSpatial(value, 1, setting, sourceFormat, 2);
                    break;
                case "area":
                    out = this.formatSpatial(value, 2, setting, sourceFormat, 2);
                    break;
                case "elevation":
                    out = this.formatSpatial(value, 1, setting, sourceFormat, 1);
                    break;
                default:
                    break;
            }
            return(out);
        },
        
        /**
         * Is projection with given EPSG code a polar one?
         * @param {string} proj
         * @return {Boolean}
         */
        isPolarProjection: function(proj) {
            switch(proj) {
                case "EPSG:3031":                
                case "EPSG:3995":
                case "EPSG:102020": 
                    return(true);
                default:
                    return(false);
            }
        },
        
        /**
         * Get the lat/lon extent of a projection
         * @param {string} proj
         * @returns {ol.Extent}
         */
        projectionLatLonExtent: function(proj) {
            var extent = [];
            switch(proj) {
                case "EPSG:3031":
                    extent = [-180.0, -90.0, 180.0, -50.0];
                    break;
                case "EPSG:3995":
                    extent = [-180.0, 60.0, 180.0, 90.0];
                    break;
                case "EPSG:3762":
                    extent = [-50.0, -65.0, -18.0, -50.0];
                    break;
                case "EPSG:102020": 
                    extent = [-180.0, -89.0, 180.0, -30.0];
                    break;
                default:
                    extent = [-180.0, -85.06, 180.0, 85.06];
                    break;
            }
            return(extent);
        },
        
        /**
         * 
         * @param {ol.Coordinate} coordinate
         * @param {ol.Extent} extent
         * @returns {boolean}
         */
        withinExtent: function(coordinate, extent) {
            return(
                magic.modules.Common.floatInRange(coordinate[0], extent[0], extent[2], this.ANGULAR_TOLERANCE) &&
                magic.modules.Common.floatInRange(coordinate[1], extent[1], extent[3], this.ANGULAR_TOLERANCE)
            );
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
         * Compute geodesic length of linestring
         * @param {ol.geom.linestring} geom
         * @param {ol.Map} map
         * @returns {float}
         */
        geodesicLength: function(geom, map) {
            map = map || magic.runtime.map;
            var geodesicLength = 0.0;
            var coords = geom.getCoordinates();
            for (var i = 0, ii = coords.length - 1; i < ii; ++i) {
                var c1 = ol.proj.transform(coords[i], map.getView().getProjection().getCode(), "EPSG:4326");
                var c2 = ol.proj.transform(coords[i + 1], map.getView().getProjection().getCode(), "EPSG:4326");
                geodesicLength += this.WGS84.haversineDistance(c1, c2);
            }    
            return(geodesicLength);
        },

        /**
         * Compute geodesic area of polygon
         * @param {ol.geom.polygon} geom
         * @param {ol.Map} map
         * @returns {float}
         */
        geodesicArea: function(geom, map) {    
            var polyClone = geom.clone().transform(map.getView().getProjection().getCode(), "EPSG:4326");    
            return(Math.abs(this.WGS84.geodesicArea(polyClone.getLinearRing[0].getCoordinates())));
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
                extPt.transform(sourceProj, magic.runtime.map.getView().getProjection().getCode());
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
                    densifiedPoly.transform(sourceProj, magic.runtime.map.getView().getProjection().getCode());                    
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
            var resolution = map.getView().getResolution();
            var units = map.getView().getProjection().getUnits();
            var dpi = 25.4 / 0.28;
            var mpu = ol.proj.METERS_PER_UNIT[units];
            var scale = resolution * mpu * 39.37 * dpi; /* NB magic numbers */
            return(parseFloat(scale));
        },
        
        /**
         * Get resolution corresponding to given scale
         * @param {number} scale
         * @returns {float}
         */
        getResolutionFromScale: function(scale) {
            var resolutions = magic.runtime.map.getView().getResolutions();
            var res = resolutions[0];
            if (!isNaN(scale)) {
                var units = magic.runtime.map.getView().getProjection().getUnits();
                var dpi = 25.4 / 0.28;
                var mpu = ol.proj.METERS_PER_UNIT[units];
                res = parseFloat(scale)/(mpu * 39.37 * dpi);
            }
            return(res);
        },
        
        /**
         * For a point in projected co-ordinates, translate a heading so it looks plausible on the map
         * @param {ol.geom.Point} p
         * @param {float} heading
         * @return {float}
         */
        headingWrtTrueNorth: function(p, heading) {
            var pcoords = p.getCoordinates();
            var vp = new Vector(pcoords[0], pcoords[1]);
            /* Point towards top of map from P */
            var b = new ol.geom.Point([0, 1]);
            var vb = new Vector(b.x, b.y);		
            var cosAngle = vp.unit().dot(vb);
            return((heading - 180.0*Math.acos(cosAngle)/Math.PI) % 360.0);
        }
        
    });

}();