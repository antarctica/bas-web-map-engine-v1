/*
 * Implements embedded OpenLayers maps
 * Version 1.0
 * David Herbert, BAS April 2017
 */

var embedded_map;
var embedded_overlay;

function showAlert(msg) {
    /* May eventually use bootbox or some other library to provide more seamless looking alerts in keeping with the rest of the page */
    alert(msg);
}

function isApexContext() {
    //TODO - logic here to detect an Application Express context from the DOM - this will trigger a special event to inform Apex of a map click,
    // and will NOT display pop-ups on the map (as the information will be available in the database report)
    return(false);
}

/**
 * Apply proxying to a URL (e.g. a vector feed) unless it's from the same host
 * @param {String} url
 * @returns {String}
 */
function proxyUrl(url) {
    var proxyUrl = url;
    if (url.indexOf(window.location.protocol + "//" + window.location.hostname) != 0) {
        proxyUrl = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(url);
    }
    return(proxyUrl);
}

/**
 * Get scale of map
 * https://groups.google.com/forum/#!searchin/ol3-dev/dpi/ol3-dev/RAJa4locqaM/4AzBrkndL9AJ
 * @returns {float}
 */
function getCurrentMapScale() {                
    var resolution = embedded_map.getView().getResolution();
    var units = embedded_map.getView().getProjection().getUnits();
    var dpi = 25.4 / 0.28;
    var mpu = ol.proj.METERS_PER_UNIT[units];
    var scale = "" + (resolution * mpu * 39.37 * dpi); /* NB magic numbers */
    var dp1 = scale.indexOf(".");
    if (dp1 >= 0) {
        var dp2 = scale.indexOf("9");                
        var scaleFactor = Math.pow(10, dp1-dp2);
        scale = scaleFactor * Math.round(parseFloat(scale)/scaleFactor);
    }
    return("Map scale 1:" + scale);
}

/**
 * Specify view parameters from data payload
 * @param {Object} data
 */
function getViewData(data) {
    if (typeof data.center === "string") {
        data.center = JSON.parse(data.center);
    }
    if (typeof data.proj_extent === "string") {
        data.proj_extent = JSON.parse(data.proj_extent);
    }
    if (typeof data.resolutions === "string") {
        data.resolutions = JSON.parse(data.resolutions);
    }
    if (data.projection == "EPSG:3857") {
        /* OSM */
        return({
            center: data.center,        
            rotation: 0.0,
            zoom: data.zoom,
            projection: ol.proj.get(data.projection),
            minZoom: 1, 
            maxZoom: 20
        });
    } else {
        /* Other projection */
        var proj = ol.proj.get(data.projection);
        proj.setExtent(data.proj_extent);
        proj.setWorldExtent(data.proj_extent);
        return({
            center: data.center,        
            rotation: 0.0,
            zoom: data.zoom,
            projection: proj,           
            maxResolution: data.resolutions[0], 
            resolutions: data.resolutions
        });
    }    
}

/**
 * Create the OL layers necessary for the map
 * @param {Object} data
 * @param {ol.view} view
 */
function createLayers(data, view) { 
    var layers = [];
    var dataLayers = JSON.parse(data.layers.value);
    if (jQuery.isArray(dataLayers)) {
        var proj = view.getProjection();
        for (var i = 0; i < dataLayers.length; i++) {
            var layer;
            var nd = dataLayers[i];
            if (nd.wms_source == "osm") {
                /* OpenStreetMap layer */
                layer = new ol.layer.Tile({source: new ol.source.OSM()});
                layer.set("metadata", nd);
            } else if (nd.is_single_tile) {
                /* Render point layers with a single tile for labelling free of tile boundary effects */
                var wmsSource = new ol.source.ImageWMS(({
                    url: nd.wms_source,
                    params: {
                        "LAYERS": nd.feature_name,
                        "STYLES": ""
                    },
                    projection: proj
                }));
                layer = new ol.layer.Image({
                    name: nd.name,
                    visible: true,
                    opacity: nd.opacity || 1.0,
                    metadata: nd,
                    source: wmsSource
                });                    
            } else {
                /* Non-point layer */
                var wmsVersion = "1.3.0";
                var wmsSource = new ol.source.TileWMS({
                    url: nd.wms_source,
                    params: {
                        "LAYERS": nd.feature_name,
                        "STYLES": "",
                        "TRANSPARENT": true,
                        "CRS": proj.getCode(),
                        "SRS": proj.getCode(),
                        "VERSION": wmsVersion,
                        "TILED": true
                    },
                    tileGrid: new ol.tilegrid.TileGrid({
                        resolutions: view.getResolutions(),
                        origin: proj.getExtent().slice(0, 2)
                    }),
                    projection: proj
                });
                layer = new ol.layer.Tile({
                    name: nd.name,
                    visible: true,
                    opacity: nd.opacity || 1.0,                    
                    metadata: nd,
                    source: wmsSource
                });
            }
            layers.push(layer);
        }
    }
    return(layers);
}

/**
 * Write suitable attributes to the supplied div
 * @param {jQuery.object} container
 * @param {Object} attrs
 * @param {Object} geom
 */
function displayFeatureData(container, attrs, geom) {
    var html = "";
    if (geom.type && geom.type.toLowerCase().indexOf("point") >= 0) {
        /* Point geometry => display lat/lon */
        var lonLat = ol.proj.toLonLat(geom.coordinates, embedded_map.getView().getProjection());
        html += '<div style="margin-bottom:5px">Lat: <b>' + (lonLat[1].toFixed(2)) + "</b>, Long: <b>" + (lonLat[0].toFixed(2)) + '</b></div>';
    }
    if (!jQuery.isEmptyObject(attrs)) {
        var keys = [];
        for (var key in attrs) {
            if (!key.match(/id$/) && key != "bbox") {
                keys.push(key);
            }
        }
        if (keys.length > 0) {
            keys.sort();
            var maxAttrs = Math.min(keys.length, 6);
            html += '<table cellspacing="5" style="table-layout:fixed; width: 200px">';
            for (var i = 0; i < maxAttrs; i++) {
                html += '<tr><td width="60" style="overflow:hidden">' + keys[i] + '</td><td width="140" style="overflow:hidden">' + attrs[keys[i]] + '</td></tr>';
            }
            html += '</table>';
        } else {
            html += '<div>No attributes found</div>';
        }        
    } else {
        html += '<div>No attributes found</div>';
    }
    container.html(html);
}

/* Load jQuery if not already present */
if (!window.jQuery){
    var jq = document.createElement("script");
    jq.type = "text/javascript";
    jq.src = "/static/js/embedded/jquery.js";
    document.getElementsByTagName("head")[0].appendChild(jq);
}

function ensureJQueryLoaded() {
    if (window.jQuery) {
        init();
    } else {
        setTimeout(ensureJQueryLoaded, 50);
    }
}
ensureJQueryLoaded();

function init() {
    jQuery(document).ready(function() {
        if (!embedded_map_name) {
            /* The global 'embedded_map_name' wasn't set earlier by map-specific code */
            showAlert("No map name specified - please set variable >embedded_map_name< to the name of the map you wish to embed in the page");
        } else {            
            /* Go ahead and create the map */
            var baseUrl = (window.location.origin || (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port: "")));
            jQuery.ajax({
                url: baseUrl + "/embedded_maps/name/" + embedded_map_name,
                method: "GET",
                dataType: "json"
            }).done(function(data) {
                /* Prepare map div for embedding */
                var embedDivId = data.embed || "map";
                var embedDiv = jQuery("#" + embedDivId);
                if (embedDiv.length > 0) {
                    /* Somewhere to put the map - size appropriately */
                    var embedWidth = data.width || 400;
                    var embedHeight = data.height || 300;
                    embedDiv.width(embedWidth + "px");
                    embedDiv.height(embedHeight + "px");
                    var embedView = new ol.View(getViewData(data));
                    var embedLayers = createLayers(data, embedView);
                    if (embedLayers.length > 0) {
                        /* Some data to display */
                        embedded_map = new ol.Map({
                            renderer: "canvas",
                            loadTilesWhileAnimating: true,
                            loadTilesWhileInteracting: true,
                            layers: embedLayers,
                            controls: [
                                new ol.control.Zoom(),
                                new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
                                new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
                                new ol.control.MousePosition({
                                    projection: "EPSG:4326",
                                    className: "custom-mouse-position",
                                    coordinateFormat: function (xy) {
                                        return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
                                    }
                                })
                            ],
                            interactions: ol.interaction.defaults(),
                            target: embedDivId,
                            view: embedView
                        });
                        var scale = getCurrentMapScale();
                        jQuery("div.custom-scale-line-top").attr("title", scale);
                        jQuery("div.custom-scale-line-bottom").attr("title", scale);
                        embedView.on("change:resolution", function() {
                            /* Mouseover of the map scale bar to provide tooltip of the current map scale */
                            var scale = getCurrentMapScale();
                            jQuery("div.custom-scale-line-top").attr("title", scale);
                            jQuery("div.custom-scale-line-bottom").attr("title", scale);
                        });
                        /* Add GetFeatureInfo handlers */
                        embedded_map.on("singleclick", function(evt) {                            
                            embedded_map.getLayers().forEach(function(layer) {
                                if (layer.getVisible() === true) {
                                    var md = layer.get("metadata");
                                    if (md && md.is_interactive) {
                                        var gfiUrl = layer.getSource().getGetFeatureInfoUrl(
                                            evt.coordinate, 
                                            embedded_map.getView().getResolution(), 
                                            embedded_map.getView().getProjection(),
                                            {
                                                "LAYERS": md.feature_name,
                                                "QUERY_LAYERS": md.feature_name,
                                                "INFO_FORMAT": "application/json", 
                                                "FEATURE_COUNT": 10,
                                                "buffer": 20
                                            }
                                        );
                                        jQuery.ajax({
                                            url: gfiUrl,
                                            method: "GET"
                                        }).done(function(data) {
                                            //console.log(data);
                                            if (data.type == "FeatureCollection" && jQuery.isArray(data.features) && data.features.length > 0) {
                                                if (!isApexContext()) {
                                                    var popupDiv = jQuery(embedded_overlay.getElement());
                                                    var contentDivs = popupDiv.children("div");
                                                    var chooser = jQuery(contentDivs[0]);
                                                    var content = jQuery(contentDivs[1]);
                                                    if (data.features.length == 1) {
                                                        /* Hide the chooser */
                                                        chooser.css("display", "none");                                                        
                                                    } else {
                                                        /* Display a chooser */                                                        
                                                        chooser.empty();                                                        
                                                        for (var i = 0; i < data.features.length; i++) {
                                                            var anch = jQuery('<a/>', {
                                                                href: "Javascript:void(0)",
                                                                text: (i+1) + ""
                                                            });
                                                            chooser.append([anch, '<span>&nbsp;&nbsp;</span>']); 
                                                            var fpayload = data.features[i];
                                                            anch.click(jQuery.proxy(function() {
                                                                displayFeatureData(content, this.properties, this.geometry);
                                                            }, fpayload));
                                                        }
                                                        chooser.css("display", "block");
                                                    } 
                                                    displayFeatureData(content, data.features[0].properties, data.features[0].geometry);
                                                    embedded_overlay.setPosition(evt.coordinate);
                                                } else {
                                                    //TODO package data and fire event for Apex case
                                                }                                                
                                            }                                            
                                        }).fail(function(xhr) {
                                            var msg = "Failed to get info for clicked map feature";
                                            if (xhr.status == 401) {
                                                msg = "Not authorised to query underlying data";
                                            }
                                            showAlert(msg);
                                        });
                                    }
                                }
                            });
                        });
                    } else {
                        showAlert("No data found to display on map");
                    }
                    /* Add pop-up div to map if required */
                    if (!isApexContext()) {
                        embedDiv.after(
                            '<div class="ol-popup">' + 
                                '<a href="#" class="ol-popup-closer"></a>' + 
                                '<div class="ol-popup-feature-chooser"></div>' + 
                                '<div class="ol-popup-feature-data"></div>'+ 
                            '</div>'
                        );
                        embedded_overlay = new ol.Overlay({
                            element: jQuery("div.ol-popup")[0],
                            autoPan: true,
                            autoPanAnimation: {
                                duration: 250
                            }
                        });
                        embedded_map.addOverlay(embedded_overlay);
                        var closer = jQuery("a.ol-popup-closer");
                        closer.click(function() {
                            embedded_overlay.setPosition(undefined);
                            closer.blur();
                            return(false);
                        });
                    }
                } else {
                    showAlert("Cannot find HTML element with id >" + embedDivId + "< to insert map into");
                }
            }).fail(function(xhr, status, error){
                showAlert("Request for embedded map data failed - status was " + status + ", error was " + error);
            });
        }
    });
}






