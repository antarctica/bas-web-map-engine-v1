/*
 * Implements embedded OpenLayers maps
 * Version 2.0
 * David Herbert, BAS December 2017
 */

function showAlert(msg) {
    /* May eventually use bootbox or some other library to provide more seamless looking alerts in keeping with the rest of the page */
    alert(msg);
}

/**
 * Compensate for lack of universal support of URLSearchParams
 * @param {String} name
 * @param {String} url
 * @return {String}
 */
function getUrlParameter(name, url) {
    url = url || window.location.search;
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(url);
    return(results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' ').replace(/%%/g, "%").replace(/%27/g, "'")));
};

/**
 * Get scale of map
 * https://groups.google.com/forum/#!searchin/ol3-dev/dpi/ol3-dev/RAJa4locqaM/4AzBrkndL9AJ
 * @param {ol.Map} map
 * @returns {float}
 */
function getCurrentMapScale(map) {                
    var resolution = map.getView().getResolution();
    var units = map.getView().getProjection().getUnits();
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
    var rotation = parseFloat(data.rotation);
    rotation = isNaN(rotation) ? 0.0 : rotation*Math.PI/180.0;
    if (data.projection == "EPSG:3857") {
        /* OSM */
        return({
            center: data.center,        
            rotation: rotation,
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
            rotation: rotation,
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
 * @param {Object} viewData
 * @param {String} serviceUrl
 */
function createLayers(data, viewData, serviceUrl) { 
    var layers = [];
    var apexFilter = getUrlParameter("filter", serviceUrl);
    console.log(apexFilter);
    var dataLayers = JSON.parse(data.layers.value);
    if (jQuery.isArray(dataLayers)) {
        var proj = viewData.projection;
        for (var i = 0; i < dataLayers.length; i++) {
            var layer;
            var nd = dataLayers[i];
            var cqlFilter = (nd.is_filterable === true && apexFilter) ? {
                "CQL_FILTER": apexFilter
            } : {};
            if (nd.wms_source == "osm") {
                /* OpenStreetMap layer */
                layer = new ol.layer.Tile({source: new ol.source.OSM()});
                layer.set("metadata", nd);
            } else if (nd.is_single_tile) {
                /* Render point layers with a single tile for labelling free of tile boundary effects */                
                var wmsSource = new ol.source.ImageWMS(({
                    url: nd.wms_source,
                    crossOrigin: "anonymous",
                    params: jQuery.extend({
                        "LAYERS": nd.feature_name,
                        "STYLES": nd.style_name || ""
                    }, cqlFilter),
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
                    crossOrigin: "anonymous",
                    params: jQuery.extend({
                        "LAYERS": nd.feature_name,
                        "STYLES": nd.style_name || "",
                        "TRANSPARENT": true,
                        "CRS": proj.getCode(),
                        "SRS": proj.getCode(),
                        "VERSION": wmsVersion,
                        "TILED": true
                    }, cqlFilter),
                    tileGrid: new ol.tilegrid.TileGrid({
                        resolutions: viewData.resolutions,
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

function addGetFeatureInfoHandlers(map) {
    /* Add GetFeatureInfo handlers */
    map.on("singleclick", function(evt) {
        var fprops = [];
        var deferreds = [];
        this.forEachLayerAtPixel(evt.pixel, function(layer) {
            var md = layer.get("metadata");
            var url = layer.getSource().getGetFeatureInfoUrl(
                evt.coordinate, 
                this.getView().getResolution(), 
                this.getView().getProjection(),
                {
                    "LAYERS": md.feature_name,
                    "QUERY_LAYERS": md.feature_name,
                    "INFO_FORMAT": "application/json", 
                    "FEATURE_COUNT": 10,
                    "buffer": 20
                }
            );  
            if (url) {
                deferreds.push(jQuery.getJSON(url, function(data) {                    
                    if (jQuery.isArray(data.features) && data.features.length > 0) {
                        jQuery.each(data.features, function(idx, f) {
                            if (f.geometry) {                                                                                            
                                fprops.push(jQuery.extend({}, f.properties, {"layer": layer}));                                       
                            }
                        });
                    }
                }));
            }
        }, this, function(layer) {
            var md = layer.get("metadata");
            return(layer.getVisible() === true && md && md.wms_source && md.is_interactive === true);
        }, this);

        /* Now apply all the feature queries and assemble a pop-up */
        jQuery.when.apply(jQuery, deferreds).done(jQuery.proxy(function() {
            displayFeatureData(evt.coordinate, fprops, this);
        }, this));        
    }, map);
}

/**
 * Write suitable attributes to the supplied div
 * @param {ol.coordinate} coord
 * @param {Object} data
 * @param {ol.Map} map
 */
function displayFeatureData(coord, data, map) {
    /* Add overlay if necessary */
    var mapName = map.get("name");
    var mapTarget = jQuery(map.getTarget());
    var overlay = map.getOverlayById(mapName + "-popup-overlay");
    if (!overlay) {
        /* Need to add the overlay first */
        mapTarget.after(
            '<div id="' + mapName + '-popup-overlay-container" class="ol-popup">' + 
                '<a href="#" class="ol-popup-closer"></a>' + 
                '<div class="ol-popup-feature-chooser"></div>' + 
                '<div class="ol-popup-feature-data"></div>'+ 
            '</div>'
        );
        overlay = new ol.Overlay({
            id: mapName + "-popup-overlay",
            element: jQuery("#" + mapName + "-popup-overlay-container")[0],
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
        map.addOverlay(overlay);
        var closer = jQuery("#" + mapName + "-popup-overlay-container").find("a.ol-popup-closer");
        closer.click(function() {
            overlay.setPosition(undefined);
            closer.blur();
            return(false);
        });
    }
    /* We have the overlay now */
    var popupDiv = jQuery(overlay.getElement());
    var contentDivs = popupDiv.children("div");
    var chooser = jQuery(contentDivs[0]);
    var content = jQuery(contentDivs[1]);
    if (!data || data.length == 0) {
        /* No displayable features */
        return;
    } else if (data.length == 1) {
        /* Hide the chooser */        
        map.set("clickdata", []);
        chooser.css("display", "none");                                                        
    } else {
        /* Display a chooser */                                                        
        chooser.empty();        
        map.set("clickdata", data);
        for (var i = 0; i < data.length; i++) {
            var anch = jQuery('<a>', {
                id: "chooser-anch-" + i,
                href: "Javascript:void(0)",
                text: (i+1) + ""
            });
            chooser.append([anch, '<span>&nbsp;&nbsp;</span>']); 
            anch.off("click").on("click", function(evt) {
                evt.preventDefault();
                var anchIdx = evt.currentTarget.id.replace("chooser-anch-", "");
                writePopupContent(content, map.get("clickdata")[parseInt(anchIdx)]);
            });
        }
        chooser.css("display", "block");
    } 
    writePopupContent(content, data[0]);
    overlay.setPosition(coord);
}

function writePopupContent(div, data) {     
    if (data.layer && data.layer.get("metadata")) {
        var md = data.layer.get("metadata");
        if (jQuery.isArray(md.attribute_map)) {
            /* Get all the attributes with a "displayed" property true */
            var displays = jQuery.map(md.attribute_map, function(elt) {
                return(elt.displayed === true ? elt : null);
            });              
            /* Now sort the above array by the ordinal */
            displays.sort(function(a, b) {
                var orda = a["ordinal"] || 999;
                var ordb = b["ordinal"] || 999;
                return((orda < ordb) ? -1 : (orda > ordb) ? 1 : 0);
            });            
            /* Create the markup */
            var markup = '<table cellspacing="5" style="table-layout:fixed; width: 200px">';            
            jQuery.each(displays, function(idx, elt) {
                /* Deal with massive numbers of decimal places in floats much beloved of Oracle */
                var output = data[elt.name];
                if (typeof output == "number" && !isNaN(parseFloat(output))) {
                    /* This may be a float */
                    if (parseInt(output) != output) {
                        /* Not an integer => requires toFixed() treatment */
                        output = output.toFixed(4);
                    }
                }
                markup += '<tr><td width="60" style="overflow:hidden">' + elt.alias + '</td><td width="140" style="overflow:hidden">' + output + '</td></tr>';
            });
            markup += '</table>';
            div.html(markup);
        } else {
            div.html("No attribute information found");
        }
    } else {
        div.html("No attribute information found");
    }
}

/* Load jQuery if not already present */
if (!window.jQuery){
    var jq = document.createElement("script");
    jq.type = "text/javascript";
    jq.src = "/static/js/embedded/jquery.min.js";
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

/**
 * Stores the embedded map references keyed by map name i.e:
 * {
 *     "<name1>": <ol.Map1>,
 *     "<name2>": <ol.Map2>,
 *    ...
 * } 
 */
var embeddedMaps = {};

/**
 * Create the OpenLayers map
 * @param {String} name
 * @param {Object} div
 * @param {Array} layers
 * @param {ol.View} view
 * @param {ol.extent} extent
 * @param {ol.size} mapsize
 */
function createMap(name, div, layers, view, extent, mapsize) {                   
    embeddedMaps[name] = new ol.Map({
        renderer: "canvas",
        loadTilesWhileAnimating: true,
        loadTilesWhileInteracting: true,
        layers: layers,
        controls: [
            new ol.control.Zoom(),
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
            new ol.control.MousePosition({
                projection: "EPSG:4326",
                className: "custom-mouse-position",
                coordinateFormat: function (xy) {
                    return("Lat : " + xy[1].toFixed(2) + ", lon : " + xy[0].toFixed(2));
                }
            })
        ],
        interactions: ol.interaction.defaults(),
        target: div,
        view: view
    });
    /* Set the name of the map */
    embeddedMaps[name].set("name", name, true);
    /* Show scale and enable mouseover of scale bar to show scale as map zooms */
    var scale = getCurrentMapScale(embeddedMaps[name]);
    jQuery("div.custom-scale-line-top").attr("title", scale);
    jQuery("div.custom-scale-line-bottom").attr("title", scale);
    view.on("change:resolution", function() {
        /* Mouseover of the map scale bar to provide tooltip of the current map scale */
        var scale = getCurrentMapScale(embeddedMaps[name]);
        jQuery("div.custom-scale-line-top").attr("title", scale);
        jQuery("div.custom-scale-line-bottom").attr("title", scale);
    });
    /* Add click handlers to display pop-ups */
    addGetFeatureInfoHandlers(embeddedMaps[name]);
    /* Set view zoom level from extent and size */
    var extRes = view.getResolutionForExtent(extent, mapsize);
    var extZoom = view.getZoomForResolution(extRes);
    view.setZoom(extZoom > 0 ? extZoom-1 : 0);
}

function init() {
    jQuery(document).ready(function() {
        /* Populate URLs in test bed HTML */
        if (window.opener) {
            try {
                var serviceUrl = window.opener.magic.runtime.serviceUrl;
                jQuery("#map").attr("data-service", serviceUrl);
                jQuery("#data-service-url").html('<pre>' + serviceUrl + '</pre>');
            } catch(e) {}
        }
        var embeds = jQuery("div[data-service]");
        if (embeds.length == 0) {
            showAlert("No suitable map containers found");
            return;
        }
        embeds.each(function(idx, serviceDiv) {
            var serviceUrl = jQuery(serviceDiv).data("service");
            jQuery.ajax({
                url: serviceUrl,
                method: "GET",
                dataType: "json"
            }).done(function(data) {                
                if (embeddedMaps[data.name]) {
                    /* Attempting multiple instances of single map */
                    showAlert("Attempting to have the same map multiple times on one page");
                    return;
                }
                /* Get view specification */
                var embedViewData = getViewData(data);
                var embedLayers = createLayers(data, embedViewData, serviceUrl);
                if (embedLayers.length == 0) {
                    showAlert("Map contains no data layers");
                    return;
                }
                var embedView = new ol.View(embedViewData);
                var embedMapSize = [jQuery(serviceDiv).width(), jQuery(serviceDiv).height()];
                /* Get view default extent */
                var defaultExtent = (typeof data.data_extent == "string" && data.data_extent != "") ? JSON.parse(data.data_extent) : data.data_extent;                        
                if (!jQuery.isArray(defaultExtent) || defaultExtent.length != 4) {
                    defaultExtent = embedViewData.projection.getExtent();
                }   
                /* See if we can be more precise by applying filter to the filterable data layer */
                var filterFeats = jQuery.map(embedLayers, function(layer) {
                    var md = layer.get("metadata");
                    return(md.is_filterable ? md.feature_name : null);
                });
                if (filterFeats.length > 0) {
                    /* Get the true data extent if possible */
                    var filterFeat = filterFeats[0];    /* Note only use the first one */
                    var serviceBase = serviceUrl.substring(0, serviceUrl.indexOf("embedded_maps/name"));
                    var filter = getUrlParameter("filter", serviceUrl);
                    var filterUrl = serviceBase + "gs/filtered_extent/" + encodeURIComponent(filterFeat);
                    if (filter != null && filter !="") {
                        filterUrl = filterUrl + "/" + encodeURIComponent(filter).replace(/'/g, "%27");
                    }
                    jQuery.getJSON(filterUrl, function(wfsData) {  
                        if (jQuery.isArray(wfsData.extent) && wfsData.extent.length == 4) {
                            createMap(data.name, serviceDiv, embedLayers, embedView, wfsData.extent, embedMapSize);
                        } else {
                            createMap(data.name, serviceDiv, embedLayers, embedView, defaultExtent, embedMapSize);                            
                        }
                    });
                } else {
                    /* Use the default extent */
                    createMap(data.name, serviceDiv, embedLayers, embedView, defaultExtent, embedMapSize); 
                }                
            })
            .fail(function(xhr) {
                showAlert("Failed to get map definition from " + serviceUrl);       
            });                    
        });       
    });
}






