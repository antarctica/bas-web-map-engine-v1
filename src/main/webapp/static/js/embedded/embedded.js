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
    // # Disabled in https://gitlab.data.bas.ac.uk/MAGIC/web-map-engine/web-map-engine-v1/-/issues/35
    // if (data.projection == "EPSG:3857") {
    //     /* OSM */
    //     return({
    //         center: data.center,
    //         rotation: rotation,
    //         zoom: data.zoom,
    //         projection: ol.proj.get(data.projection),
    //         minZoom: 1,
    //         maxZoom: 20
    //     });
    // }

    // # hard code resolutions for 3857, these are ignored for OSM but used for other layers in that projection
    // # part of https://gitlab.data.bas.ac.uk/MAGIC/web-map-engine/web-map-engine-v1/-/issues/36
    if (data.projection == "EPSG:3857") {
        data.resolutions = [156543,78271,39136,19567,9784,4892,2446,1223,611,306,153];
    }

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

/**
 * Take out <key>=<numeric_value> terms in the given filter where the value is empty/null - CQL can't wildcard these
 * @param {String} filter
 * @return {String}
 */
function removeNullNumericTerms(filter) {
    var filterOut = filter;
    //console.log("Remove non-null numeric terms from filter:");
    //console.log(filter);
    if (filterOut != null && filterOut != "") {
        /* Parse into individual terms */
        var terms = filterOut.split(" AND ");
        var nonNullTerms = jQuery.grep(terms, function(term) {
            var kvp = term.split("=");
            if (jQuery.isArray(kvp) && kvp.length == 2) {
                return(kvp[1] != "");
            }
            return(true);
        });
        filterOut = nonNullTerms.join(" AND ");
    }
    //console.log("Revised filter is:");
    //console.log(filterOut);
    return(filterOut);
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
    apexFilter = removeNullNumericTerms(apexFilter);
    var dataLayers = JSON.parse(data.layers.value);
    if (jQuery.isArray(dataLayers)) {
        var proj = viewData.projection;
        for (var i = 0; i < dataLayers.length; i++) {
            var layer = null;
            var nd = dataLayers[i];
            var cqlFilter = (nd.is_filterable === true && apexFilter) ? {
                "CQL_FILTER": apexFilter
            } : {};
            if (nd.wms_source == "osm") {
                /* OpenStreetMap layer */
                layer = new ol.layer.Tile({source: new ol.source.OSM({wrapX: false})});
                layer.set("metadata", nd);
            } else if (nd.is_singletile) {
                /* Render point layers with a single tile for labelling free of tile boundary effects */                
                var wmsSource = new ol.source.ImageWMS(({
                    url: nd.wms_source,
                    attributions: getAttribution(nd),
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
                    attributions: getAttribution(nd),
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
                    projection: proj,
                    wrapX: false
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
            /* Add auto-refresh if required */
            if (!isNaN(nd.refresh_rate) && nd.refresh_rate > 0) {
                setInterval(refreshLayer, 1000*60*nd.refresh_rate, layer);
            }
        }
    }
    return(layers);
}

/**
 * Retrieve endpoint data corresponding to the input filter (match occurs if 'filter' found at start of endpoint, case-insensitive)
 * @param {string} url
 * @returns {Array}
 */
function getEndpointsBy(url) {
    if (!endpointData || !url) {
        return(null);
    }            
    return(jQuery.grep(endpointData, function(ep) {       
        /* Note that stored endpoints should be WMS ones, so remove wms|wfs|wcs from end of filter */
        var serviceNeutralFilter = url.replace(/\/w[cfm]s$/, "");
        /* Check for REST endpoints and strip everything before /rest */
        var restIdx = serviceNeutralFilter.indexOf("/rest");
        if (restIdx != -1) {
            serviceNeutralFilter = serviceNeutralFilter.substring(0, restIdx);
        }
        var foundUrl = ep["url"].indexOf(serviceNeutralFilter) == 0;                   
        if (!foundUrl && ep["url_aliases"]) {
            /* Check any of the aliases match in protocol, host and port */
            var aliases = ep["url_aliases"].split(",");
            for (var i = 0; !foundUrl && i < aliases.length; i++) {
                foundUrl = aliases[i].indexOf(serviceNeutralFilter) == 0;
            }                            
        }
        return(foundUrl);
    }));
}

/**
 * setInterval handler to refresh a layer
 * NOTE: assumes all layers are WMS
 * @param {ol.Layer} layer
 */
function refreshLayer(layer) {
    var params = layer.getSource().getParams();
    params.t = new Date().getTime();
    layer.getSource().updateParams(params); 
    console.log("Refreshing layer " + layer.get("name"));
}

/**
 * Markup for an attribution
 * @param {Object} nd
 * @return {String}
 */
function getAttribution(nd) {
    var attributionMarkup = "";
    if (nd.attribution || nd.include_legend) {
        attributionMarkup = 
            '<p><strong>' + nd.name + '</strong><br/>' + 
            'Source: ' + linkify(nd.attribution, "[External resource]");
    }
    if (nd.include_legend) {
        var cacheBuster = "&buster=" + new Date().getTime();
        var legendUrl = nd.wms_source + 
            "?service=WMS&request=GetLegendGraphic&format=image/png&width=10&height=10&styles=&layer=" + nd.feature_name + 
            "&legend_options=fontName:Nimbus%20Sans%20L%20Regular;fontAntiAliasing:true;fontColor:0x202020;fontSize:7;bgColor:0xffffff;labelMargin:4;dpi:150" + cacheBuster;
        if (attributionMarkup != "") {
            attributionMarkup += '<br/>';
        }
        attributionMarkup += '<img src="' + legendUrl + '" alt="Legend"></img>';           
    }    
    return(attributionMarkup);
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

/**
 * Replace urls in given value by links
 * Courtesy of http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
 * @param {String} value
 * @param {String} linkText
 * @returns {String}
 */
function linkify(value, linkText) {
    if (!value) {
        return("");
    }
    if (typeof value == "string") {
        if (value.indexOf("<a") != -1) {
            /* Already deemed to be linkified - don't try again! */
            return(value);
        } else if (value.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/)) {
            /* Image URL */
            return('<img src="' + value + '"></img>');
        }
        /* Check for brain-dead Ramadda URLs with ?entryid=<stuff> at the end, disguising the mime type! */
        if (value.match(/^https?:\/\//) && value.indexOf("?") > 0) {
            /* This is a pure URL with a query string */
            var valueMinusQuery = value.substring(0, value.indexOf("?"));
            if (valueMinusQuery.match(/\.(jpg|jpeg|png|gif)$/)) {
                /* Image URL displayed as inline image */
                return('<img src="' + value + '"></img>');
            }
        }
        /* http://, https://, ftp:// */
        var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;
        /* www. sans http:// or https:// */
        var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        /* Email addresses */
        var emailAddressPattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim;
        if (linkText) {
            return(value
                    .replace(urlPattern, '<a href="$&" title="$&" target="_blank">' + linkText + '</a>')
                    .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">' + linkText + '</a>')
                    .replace(emailAddressPattern, '<a href="mailto:$&">' + linkText + '</a>')
                    );
        } else {
            return(value
                    .replace(urlPattern, '<a href="$&" title="$&" target="_blank">[external resource]</a>')
                    .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
                    .replace(emailAddressPattern, '<a href="mailto:$&">$&</a>')
                    );
        }
    } else {
        return(value);
    }
}

function mapengineEndpoint(projCode) {
    return(projCode == "EPSG:3762" ? "https://www.sggis.gov.gs" : "https://add.data.bas.ac.uk");
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
                } else {
                    output = linkify(output, "[external resource]");
                }
                markup += '<tr><td width="60" style="overflow:hidden">' + elt.alias + '</td><td width="140" style="overflow:auto">' + output + '</td></tr>';
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

function plausibleExtent(extent, worldExtent) {
    var dx = Math.abs(extent[2] - extent[0]), 
        dy = Math.abs(extent[3] - extent[1]),
        wdx = Math.abs(worldExtent[2] - worldExtent[0]),
        wdy = Math.abs(worldExtent[3] - worldExtent[1]);
    return(dx >= 10.0 && dy >= 10.0 && dx < wdx && dy < wdy);    
}

function projectionWorldExtent(proj) {
    var code = proj.getCode();
    var wExt = proj.getExtent();
    if (code == "EPSG:3857") {
        /* Set a maximum extent zoomed in one notch, as the world extent leads to small maps that don't fill the area */
        wExt = jQuery.map(wExt, function(elt) {
            return(elt/2.0);
        });
    }
    return(wExt);
}

/* Load jQuery if not already present */
if (!window.jQuery){
    var jq = document.createElement("script");
    jq.type = "text/javascript";
    jq.src = "https://cdn.web.bas.ac.uk/libs/jquery/3.3.1/jquery-3.3.1.min.js";
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
 * Stores the endpoint data
 */
var endpointData = [];

/**
 * Create the OpenLayers map
 * @param {String} name
 * @param {Object} div
 * @param {Array} layers
 * @param {ol.View} view
 * @param {ol.extent} extent
 * @param {ol.size} mapsize
 * @param {boolean} osmDefaultExtent
 */
function createMap(name, div, layers, view, extent, mapsize, osmDefaultExtent) { 
    /* Set all data layers on an OSM map to only be defined within the extent - wrapping issues with data 21/03/2019 */
    var proj = view.getProjection().getCode();
    if (proj == "EPSG:3857" && osmDefaultExtent) {
        jQuery.each(layers, function(idx, lyr) {
            var md = lyr.get("metadata");
            if (md.wms_source != "osm") {
                lyr.setExtent(extent);
            }
        });
    }
    embeddedMaps[name] = new ol.Map({
        renderer: "canvas",
        loadTilesWhileAnimating: true,
        loadTilesWhileInteracting: true,
        layers: layers,
        controls: [
            new ol.control.Zoom(),
            new ol.control.ZoomToExtent({
                label: "R",
                tipLabel: "Reset to original map extent",
                extent: extent
            }),
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
            new ol.control.MousePosition({
                projection: "EPSG:4326",
                className: "custom-mouse-position",
                coordinateFormat: function (xy) {
                    return("Lat : " + xy[1].toFixed(2) + ", lon : " + xy[0].toFixed(2));
                }
            }),
            new ol.control.Attribution({
                collapsible: true,
                collapsed: true /* Note TODO: this needs to be false if the base layer is OSM */                
            })
        ],
        interactions: ol.interaction.defaults(),
        target: div,
        view: view
    });
    /* Set the name of the map */
    embeddedMaps[name].set("name", name, true);    
    /* Add click handlers to display pop-ups */
    addGetFeatureInfoHandlers(embeddedMaps[name]);
    /* Set view centre */    
    view.fit(extent, {
        size: mapsize, 
        //nearest: false,
        //constrainResolution: true,
        //padding: [100, 100, 100, 100],
        callback: function() {
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
        }
    });    
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
            /* David 2018-03-22 - no longer to be considered an error, as Apex does not create div when Helen's "see map" radio button is not checked */
            console.log("No suitable map containers found");
            //showAlert("No suitable map containers found");
            return;
        }
        embeds.each(function(idx, serviceDiv) {
            var serviceUrl = jQuery(serviceDiv).data("service");
            jQuery.ajax({
                url: serviceUrl,
                method: "GET",
                dataType: "json"
            }).done(function(data) {  
                endpointData = data.endpoints;
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
                var projCode = embedView.getProjection().getCode();
                var embedMapSize = [jQuery(serviceDiv).width(), jQuery(serviceDiv).height()];
                /* Get view default extent */
                var osmExtentIsDefault = false;
                var defaultExtent = (typeof data.data_extent == "string" && data.data_extent != "") ? JSON.parse(data.data_extent) : data.data_extent;                        
                if (!jQuery.isArray(defaultExtent) || defaultExtent.length != 4) {
                    /* Get extent from centre and zoom values */
                    try {
                        var res = data.resolutions[parseInt(data.zoom)];
                        var mapWidthX = res*embedMapSize[0];
                        var mapWidthY = res*embedMapSize[1];
                        defaultExtent = [
                            data.center[0]-0.5*mapWidthX,
                            data.center[1]-0.5*mapWidthY,
                            data.center[0]+0.5*mapWidthX,
                            data.center[1]+0.5*mapWidthY
                        ];
                    } catch(e) {
                        projectionWorldExtent(embedViewData.projection);
                        osmExtentIsDefault = true;                        
                    }
                }   
                /* See if we can be more precise by applying filter to the filterable data layer */
                var filterFeats = jQuery.map(embedLayers, function(layer) {
                    var md = layer.get("metadata");
                    return(md.is_filterable ? md.feature_name : null);
                });
                if (filterFeats.length > 0) {
                    /* Get the true data extent if possible */                    
                    var filterFeat = filterFeats[0];    /* Note only use the first one */
                    var filter = getUrlParameter("filter", serviceUrl);
                    var filterUrl = mapengineEndpoint(projCode) + "/gs/filtered_extent/" + encodeURIComponent(filterFeat);
                    filterUrl = filterUrl + "/" + encodeURIComponent(projCode);
                    if (filter != null && filter !="") {
                        filterUrl = filterUrl + "/" + encodeURIComponent(filter).replace(/'/g, "%27");
                    }
                    jQuery.getJSON(filterUrl, function(wfsData) { 
                        var projWorldExtent = projectionWorldExtent(embedView.getProjection());
                        if (jQuery.isArray(wfsData.extent) && wfsData.extent.length == 4) {
                            if (plausibleExtent(wfsData.extent, projWorldExtent)) {
                                createMap(data.name, serviceDiv, embedLayers, embedView, wfsData.extent, embedMapSize, osmExtentIsDefault);
                            } else {
                                createMap(data.name, serviceDiv, embedLayers, embedView, projWorldExtent, embedMapSize, osmExtentIsDefault);
                            }
                        } else {
                            createMap(data.name, serviceDiv, embedLayers, embedView, defaultExtent, embedMapSize, osmExtentIsDefault);                            
                        }
                    });
                } else {
                    /* Use the default extent */
                    createMap(data.name, serviceDiv, embedLayers, embedView, defaultExtent, embedMapSize, osmExtentIsDefault); 
                }                
            })
            .fail(function(xhr) {
                showAlert("Failed to get map definition from " + serviceUrl);       
            });                    
        });       
    });
}






