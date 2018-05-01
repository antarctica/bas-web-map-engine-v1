/* Attribution and legend modal dialog */

magic.classes.AttributionModal = function(options) { 
    
    /* API */
    this.target = options.target;
    this.wms = options.wms;
    
    /* Internal */
    this.layer = null;
    this.caption = "";
    this.metadataRecord = [
        {name: "abstract", caption: "Abstract", type: "long_text"},
        {name: "srs", caption: "Projection", type: "text"},
        {name: "wmsfeed", caption: "OGC WMS", type: "text"},
        {name: "keywords", caption: "Keywords", type: "text"},
        {name: "bboxsrs", caption: "Bounds (SRS)", type: "text"},
        {name: "bboxwgs84", caption: "Bounds (WGS84)", type: "text"},
        {name: "attribution", caption: "Attribution", type: "text"},
        {name: "metadataurl", caption: "Metadata URL", type: "text"},
        {name: "dataurl", caption: "Get data URL", type: "text"}
    ];
    var attributionMarkup = jQuery("#attribution-modal");
    if (attributionMarkup.length == 0) {
        jQuery("#map-container").after(
            '<!-- Attribution modal -->' + 
            '<div class="modal fade" id="attribution-modal" tabindex="-1" role="dialog" aria-labelledby="attribution-title" aria-hidden="true">' + 
                '<div class="modal-dialog modal-sm">' + 
                    '<div class="modal-content" style="width:400px">' + 
                        '<div class="modal-header">' + 
                            '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' + 
                            '<h4 class="modal-title" id="attribution-title">Layer name</h4>' + 
                        '</div>' + 
                        '<div class="modal-body attribution-content">' + 
                            '<div role="tabpanel">' + 
                                '<ul class="nav nav-tabs" role="tablist">' + 
                                    '<li role="presentation" class="active">' + 
                                        '<a role="tab" data-toggle="tab" href="#attribution-legend" aria-controls="attribution-legend">Legend</a>' + 
                                    '</li>' + 
                                    '<li role="presentation">' + 
                                        '<a role="tab" data-toggle="tab" href="#attribution-metadata" aria-controls="attribution-metadata">Metadata</a>' + 
                                    '</li>' + 
                                '</ul>' + 
                                '<div class="tab-content">' + 
                                    '<div id="attribution-legend" role="tabpanel" class="tab-pane active">' + 
                                        'Loading legend...' + 
                                    '</div>' +
                                    '<div id="attribution-metadata" role="tabpanel" class="tab-pane">' + 
                                        'Loading metadata...' + 
                                    '</div>' + 
                                '</div>' + 
                            '</div>' + 
                        '</div>' + 
                        '<div class="modal-footer attribution-footer">' + 
                            '<button type="button" class="btn-sm btn-primary" data-dismiss="modal">Close</button>' + 
                        '</div>' + 
                    '</div>' + 
                '</div>' + 
            '</div>'
        );
    };
    jQuery("#" + this.target).on("shown.bs.modal", jQuery.proxy(function() {
        this.legendMarkup();  
        jQuery('a[href="#attribution-legend"]').tab("show");
    }, this));
    jQuery('a[href="#attribution-legend"]').on("shown.bs.tab", jQuery.proxy(function(evt) {
        /* Legend */
        this.legendMarkup();        
    }, this));
    jQuery('a[href="#attribution-metadata"]').on("shown.bs.tab", jQuery.proxy(function(evt) {
        /* Metadata */            
        this.metadataMarkup();        
    }, this));   
};

/**
 * Set the modal to display data for the given layer
 * @param {ol.Layer} layer
 */
magic.classes.AttributionModal.prototype.show = function(layer) {
    this.layer = layer;
    jQuery("#attribution-title").html(layer.get("name"));
    jQuery("#" + this.target).modal("show");
};

/**
 * Create the legend markup
 */
magic.classes.AttributionModal.prototype.legendMarkup = function() {
    var legendUrl = null; 
    var content = '<div class="attribution-legend-content">';
    if (this.layer && this.layer.get("metadata")) {
        var md = this.layer.get("metadata");        
        if (md.legend_graphic) {
            /* Non-WMS derived legend graphic e.g. a canned image */
            legendUrl = md.legend_graphic;
        } else if (md.source.wms_source) {
            /* Derive from same WMS as layer */
            var wmsUrl = md.source.wms_source;
            var styles = "";
            if (jQuery.isFunction(this.layer.getSource().getParams)) {
                styles = this.layer.getSource().getParams()["STYLES"];
            }
            /* User may have changed the style of the layer, so important that we don't retrieve from browser cache - David 17/02/2017 */
            var cacheBuster = "&buster=" + new Date().getTime();
            /* Geoserver vendor options, should have no effect for other WMS services like MapServer */
            var geoserverOpts = "&legend_options=fontName:Bitstream Vera Sans Mono;fontAntiAliasing:true;fontColor:0xffffff;fontSize:6;bgColor:0x272b30;dpi:180";
            legendUrl = magic.modules.Endpoints.getOgcEndpoint(wmsUrl, "wms") + 
                "?service=WMS&request=GetLegendGraphic&format=image/png&width=20&height=20" + 
                "&style=" + styles + 
                "&layer=" + md.source.feature_name + 
                geoserverOpts + 
                cacheBuster;            
        }
    }
    if (legendUrl != null) {
        content += 
            '<div style="width:100%;background-color:#272b30">' + 
                '<img style="padding:10px;background-color:#272b30" src="' + legendUrl + '" alt="legend"></img>' + 
            '</div>';  
    } else {
        content += '<div class="attribution-title">No legend available</div>';
    }
    content += '</div>';
    jQuery("#attribution-legend").html(content);
};

/**
 * Create the metadata markup
 */
magic.classes.AttributionModal.prototype.metadataMarkup = function() {
    var md = this.layer.get("metadata");
    if (md) {
        if (md.source.wms_source || (md.source.geojson_source && md.source.feature_name)) {
            /* WMS source, or GeoJSON WFS */
            var wmsUrl;
            if (md.source.geojson_source) {
                /* This is probably only going to work as an approach with Geoserver */
                wmsUrl = md.source.geojson_source.replace("wfs", "wms");
            } else {
                wmsUrl = md.source.wms_source;
            }
            magic.modules.Common.getCapabilities(wmsUrl, jQuery.proxy(this.populateRecordWms, this), md.source.feature_name);        
        } else {
            /* Vector source */
            var sourceUrl = null;
            if (md.source.geojson_source) {
                sourceUrl = md.source.geojson_source;            
            } else if (md.source.gpx_source) {
                sourceUrl = md.source.gpx_source;            
            } else if (md.source.kml_source) {
                sourceUrl = md.source.kml_source;            
            }
            if (sourceUrl != null && sourceUrl.match("/entry/get") != null && sourceUrl.match(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/) != null) {
                /* Ramadda repository URL */
                var mdUrl = sourceUrl.replace("/get", "/show") + "&output=json";
                jQuery.getJSON(mdUrl, jQuery.proxy(this.populateRecordRamadda, this))
                .fail(function(xhr, status, errmsg) {
                    var message = "Failed to get metadata from Ramadda, error was : " + errmsg;
                    if (status == 401) {
                        "Not authorised to get metadata from Ramadda";
                    }
                    jQuery("#attribution-metadata").html(message);
                });
            } else {
                jQuery("#attribution-metadata").html("No metadata available");
            }
        }
    } else {
        jQuery("#attribution-metadata").html("No metadata available");
    }
};

/**
 * Populate a metadata record using Ramadda metadata
 * @param {Object} data
 */
magic.classes.AttributionModal.prototype.populateRecordRamadda = function(data) {
    var rec = {};
    var json = data[0];
    if (json) {        
        /* Read abstract */
        var abstractBits = [];
        jQuery.each(["name", "description", "typeName", "createDate", "filename", "filesize"], function(idx, fld) {
            if (json[fld]) {
                abstractBits.push(fld + " : " + json[fld]);
            }
        });
        rec["abstract"] = abstractBits.join("<br>");
        /* Read SRS */
        rec["srs"] = magic.modules.GeoUtils.formatProjection("EPSG:4326");                
        /* Read keywords */
        rec["keywords"] = json["type"];        
        /* Read WGS84 bounding box */
        rec["bboxwgs84"] = magic.modules.GeoUtils.formatBbox(json["bbox"], 1);        
        /* Read metadata URLs */
        if (jQuery.isArray(json["services"])) {            
            var links = [];
            jQuery.each(json["services"], function(mui, murl) {
                links.push('<a href="' + murl["url"] + '" target="_blank">[external resource]</a>');
            });
            rec["metadataurl"] = links.join("<br>");
        }
    } else {
        rec = {"error": "Malformed metadata from Ramadda"};
    }
    this.tabulate(rec);
};

/**
 * Populate a WMS metadata record from WMS GetCapabilities
 * @param {Object} getCaps GetCapabilities document
 * @param {string} featureName
 * @param {string} errMsg
 */
magic.classes.AttributionModal.prototype.populateRecordWms = function(getCaps, featureName, errMsg) {    
    var rec = {};
    if (getCaps) {
        var proj = magic.runtime.map.getView().getProjection().getCode();
        var caps = this.findFeatureInCaps(getCaps, featureName);
        if (caps != null) {
            /* Read abstract */
            rec["abstract"] = caps["Abstract"] || "";
            /* Read SRS */
            rec["srs"] = magic.modules.GeoUtils.formatProjection("EPSG:4326");
            if (jQuery.isArray(caps["CRS"])) {        
                for (var i = 0; i < caps["CRS"].length; i++) {
                    if (caps["CRS"][i] == proj) {
                        rec["srs"] = magic.modules.GeoUtils.formatProjection(caps["CRS"][i]);
                        break;
                    }
                }
            }
            /* Read WMS feed */
            var wmsSource = this.layer.get("metadata")["source"]["wms_source"];
            if (wmsSource) {
                rec["wmsfeed"] = magic.modules.Endpoints.getOgcEndpoint(wmsSource, "wms") + "?" + 
                    "SERVICE=WMS&" + 
                    "VERSION=1.3.0&" + 
                    "REQUEST=GetMap&" + 
                    "FORMAT=image/png&" + 
                    "TRANSPARENT=true&" + 
                    "LAYERS=" + featureName + "&" + 
                    "CRS=" + proj + "&" + 
                    "SRS=" + proj + "&" + 
                    "TILED=true&" + 
                    "WIDTH=1000&" + 
                    "HEIGHT=1000&" + 
                    "STYLES=&" + 
                    "BBOX=" + magic.runtime.map.getView().getProjection().getExtent().join(",");
            } else {
                rec["wmsfeed"] = "Not available";
            }
            /* Read keywords */
            rec["keywords"] = caps["KeywordList"] ? caps["KeywordList"].join("<br>") : "";
            /* Read SRS bounding box */
            if (jQuery.isArray(caps["BoundingBox"])) {
                jQuery.each(caps["BoundingBox"], function(idx, bb) {
                    if (bb.crs == magic.runtime.map.getView().getProjection().getCode()) {
                        rec["bboxsrs"] = magic.modules.GeoUtils.formatBbox(bb.extent, 0);
                        return(false);
                    }
                }); 
            }
            /* Read WGS84 bounding box */
            if (jQuery.isArray(caps["EX_GeographicBoundingBox"])) {
                rec["bboxwgs84"] = magic.modules.GeoUtils.formatBbox(caps["EX_GeographicBoundingBox"], 0);
            }
            /* Read attribution */
            if (caps["Attribution"]) {
                var value = caps["Attribution"];
                if ("source" in value && "url" in value) {
                    rec["attribution"] = '<a href="' + value.url + '">' + value.source + '</a>';
                }
            }
            /* Read metadata URL(s) */
            if (caps["MetadataURL"]) {
                var value = caps["MetadataURL"];    
                if (!jQuery.isArray(value)) {    
                    value = [value];
                }
                var links = [];
                jQuery.each(value, function(mui, murl) {
                    links.push('<a href="' + murl["OnlineResource"] + '" target="_blank">[external resource]</a>');
                });
                rec["metadataurl"] = links.join("<br>");
            }
            /* Read data URL(s) */
            if (caps["DataURL"]) {
                var value = caps["DataURL"];    
                if (!jQuery.isArray(value)) {    
                    value = [value];
                }
                var links = [];
                jQuery.each(value, function(dui, durl) {
                    links.push('<a href="' + durl["OnlineResource"] + '" target="_blank">[get data]</a>');
                });
                rec["dataurl"] = links.join("<br>");
            }
        } else {
            rec = {"error": "No entry for feature in capabilities document - has it been deleted?"};
        }
    } else {
        rec = {"error": errMsg};
    }
    this.tabulate(rec);
};

/**
 * Find the entry for 'featName' in the capabilities document - copes with legacy decisions about the presence/absence of a <namespace>: at the beginning of 
 * the feature name
 * @param {Object} caps
 * @param {String} featName
 * @return {Object}
 */
magic.classes.AttributionModal.prototype.findFeatureInCaps = function(caps, featName) {
    if (!caps[featName]) {
        /* Do more work => scan the capabilities object for a key match without the namespace */
        var matches = [];
        for (var key in caps) {
            if (featName == key.split(":").pop()) {
                matches.push(key);
            }
        }
        if (matches.length == 1) {
            return(caps[matches[0]]);
        } else {
            /* Ambiguous, so give up rather than return the wrong metadata */
            return(null);
        }
    } else {
        return(caps[featName]);
    }
};
    
/**
 * Tabulate the metadata record
 * @param {object} rec
 * @return {string} content
 */
magic.classes.AttributionModal.prototype.tabulate = function(rec) {    
    var content = '<table id="attribution-metadata-content" class="table table-striped table-condensed metadata-table show">';
    if (rec != null) {
        if (rec.error) {
            /* Something went wrong fetching the data, report in rec.error */
            content += '<tr><td colspan="2">' + rec.error + '</td></tr>';
        } else {
            /* Render metadata record */
            jQuery.each(this.metadataRecord, function(mi, mf) {
                var value = rec[mf.name];
                if (value) {
                    /* Format table row */
                    var heading = '<strong>' + mf.caption + '</strong>';
                    var linkVal = magic.modules.Common.linkify(value);
                    content += '<tr>';
                    if (mf.type == "long_text") {                    
                        content += '<td colspan="2" class="metadata" style="background-color: inherit">' + heading + '<div>' + linkVal + '</div></td>';
                    } else {
                        content += '<td valign="top" style="width:120px">' + heading + '</td><td class="metadata" style="width:270px">' + linkVal + '</td>';
                    }
                    content += '</tr>';
                }
            });
        }
    } else {        
        content += '<tr><td colspan="2">No metadata available</td></tr>';
    }
    content += '</table>';
    jQuery("#attribution-metadata").html(content);
};
