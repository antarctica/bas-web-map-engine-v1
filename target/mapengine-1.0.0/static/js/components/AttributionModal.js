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
        {name: "metadataurl", caption: "Metadata URL", type: "text"}        
    ];
    var attributionMarkup = $("#attribution-modal");
    if (attributionMarkup.length == 0) {
        $("#map-container").after(
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
    $("#" + this.target).on("shown.bs.modal", $.proxy(function() {
        this.legendMarkup();  
        $('a[href="#attribution-legend"]').tab("show");
    }, this));
    $('a[href="#attribution-legend"]').on("shown.bs.tab", $.proxy(function(evt) {
        /* Legend */
        this.legendMarkup();        
    }, this));
    $('a[href="#attribution-metadata"]').on("shown.bs.tab", $.proxy(function(evt) {
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
    $("#attribution-title").html(layer.get("name"));
    $("#" + this.target).modal("show");
};

/**
 * Create the legend markup
 */
magic.classes.AttributionModal.prototype.legendMarkup = function() {
    var content = '<div class="attribution-legend-content">';
    if (this.layer) {
        var md = this.layer.get("metadata");
        if (md) {
            var legendUrl = null;
            if (md.legend_graphic)  {
                legendUrl = md.legend_graphic;
            } else if (md.source.wms_source || (md.source.geojson_source && md.source.feature_name)) {
                 var wmsUrl;
                 if (md.source.geojson_source) {
                     wmsUrl = md.source.geojson_source.replace("wfs", "wms");
                 } else {
                     wmsUrl = md.source.wms_source;
                 }
                 legendUrl = wmsUrl + 
                     "?service=WMS&request=GetLegendGraphic&format=image/png&width=20&height=20&layer=" + md.source.feature_name + 
                     "&legend_options=fontName:Lucida Sans Regular;fontAntiAliasing:true;fontColor:0xffffff;fontSize:6;bgColor:0x272b30;dpi:180";
            }
            if (legendUrl != null) {
                 content += 
                    '<div style="width:100%;background-color:#272b30">' + 
                        '<img style="padding:10px;background-color:#272b30" src="' + legendUrl + '" alt="legend" />' + 
                    '</div>';  
            } else {
                content += '<div class="attribution-title">Vector legends not yet implemented!</div>';
            }
        } else {
            content += '<div class="attribution-title">No legend available</div>';
        }        
    } else {
        content += '<div class="attribution-title">No layer specified</div>';
    }
    content += '</div>';
    $("#attribution-legend").html(content);
};

/**
 * Create the metadata markup
 */
magic.classes.AttributionModal.prototype.metadataMarkup = function() {
    var md = this.layer.get("metadata");
    if (md.source.wms_source || (md.source.geojson_source && md.source.feature_name)) {
        /* WMS source, or GeoJSON WFS */
        var wmsUrl;
        if (md.source.geojson_source) {
            wmsUrl = md.source.geojson_source.replace("wfs", "wms");
        } else {
            wmsUrl = md.source.wms_source;
        }
        magic.modules.Common.getCapabilities(wmsUrl, $.proxy(this.populateRecordWms, this), md.source.feature_name);        
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
        if (sourceUrl != null && sourceUrl.match(/entryid=[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/)) {
            /* Ramadda repository URL */
            var mdUrl = sourceUrl.replace("/get/", "/show/") + "&output=json";
            $.getJSON(mdUrl, $.proxy(this.populateRecordRamadda, this));
        }
    }
};

/**
 * Populate a WMS metadata record from the capabilities
 * @param {Object} getCaps GetCapabilities document
 * @param {string} featureName
 */
magic.classes.AttributionModal.prototype.populateRecordRamadda = function(data) {
    var rec = {};
    var json = data[0];
    if (json) {        
        /* Read abstract */
        var abstract = [];
        $.each(["name", "description", "typeName", "createDate", "filename", "filesize"], function(idx, fld) {
            if (json[fld]) {
                abstract.push(fld + " : " + json[fld]);
            }
        });
        rec["abstract"] = abstract.join("<br />");
        /* Read SRS */
        rec["srs"] = magic.modules.GeoUtils.formatProjection("EPSG:4326");                
        /* Read keywords */
        rec["keywords"] = json["type"];        
        /* Read WGS84 bounding box */
        rec["bboxwgs84"] = magic.modules.GeoUtils.formatBbox(json["bbox"], 1);        
        /* Read metadata URLs */
        if ($.isArray(json["services"])) {            
            var links = [];
            $.each(json["services"], function(mui, murl) {
                links.push('<a href="' + murl["url"] + '" target="_blank">[external resource]</a>');
            });
            rec["metadataurl"] = links.join("<br />");
        }
    } else {
        rec = null;
    }
    this.tabulate(rec);
};

/**
 * Populate a WMS metadata record from the capabilities
 * @param {Object} getCaps GetCapabilities document
 * @param {string} featureName
 */
magic.classes.AttributionModal.prototype.populateRecordWms = function(getCaps, featureName) {
    var rec = {};
    if (getCaps && getCaps[featureName]) {
        var proj = magic.runtime.viewdata.projection.getCode();
        var caps = getCaps[featureName];
        /* Read abstract */
        rec["abstract"] = caps["Abstract"] || "";
        /* Read SRS */
        rec["srs"] = magic.modules.GeoUtils.formatProjection("EPSG:4326");
        if ($.isArray(caps["CRS"])) {        
            for (var i = 0; i < caps["CRS"].length; i++) {
                if (caps["CRS"][i] == proj) {
                    rec["srs"] = magic.modules.GeoUtils.formatProjection(caps["CRS"][i]);
                    break;
                }
            }
        }
        /* Read WMS feed */
        var wmsSource = this.layer.get("metadata")["source"]["wms_source"];
        rec["wms"] = wmsSource + "?" + 
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
            "BBOX=" + magic.runtime.viewdata.proj_extent.join(",");
        /* Read keywords */
        rec["keywords"] = caps["KeywordList"] ? caps["KeywordList"].join("<br />") : "";
        /* Read SRS bounding box */
        if ($.isArray(caps["BoundingBox"])) {
            $.each(caps["BoundingBox"], function(idx, bb) {
                if (bb.crs == magic.runtime.viewdata.projection.getCode()) {
                    rec["bboxsrs"] = magic.modules.GeoUtils.formatBbox(bb.extent, 0);
                    return(false);
                }
            }); 
        }
        /* Read WGS84 bounding box */
        if ($.isArray(caps["EX_GeographicBoundingBox"])) {
            rec["bboxwgs84"] = magic.modules.GeoUtils.formatBbox(caps["EX_GeographicBoundingBox"], 0);
        }
        /* Read attribution */
        if (caps["Attribution"]) {
            var value = caps["Attribution"];
            if ("source" in value && "url" in value) {
                rec["attribution"] = '<a href="' + value.url + '">' + value.source + '</a>';
            }
        }
        /* Read metadata URLs */
        if (caps["MetadataURL"]) {
            var value = caps["MetadataURL"];    
            if (!$.isArray(value)) {    
                value = [value];
            }
            var links = [];
            $.each(value, function(mui, murl) {
                links.push('<a href="' + murl["OnlineResource"] + '" target="_blank">[external resource]</a>');
            });
            rec["metadataurl"] = links.join("<br />");
        }
    } else {
        rec = null;
    }
    this.tabulate(rec);
};
    
/**
 * Tabulate the metadata record
 * @param {object} rec
 * @return {string} content
 */
magic.classes.AttributionModal.prototype.tabulate = function(rec) {    
    var content = '<table id="attribution-metadata-content" class="table table-striped table-condensed metadata-table show">';
    if (rec != null) {
        $.each(this.metadataRecord, $.proxy(function(mi, mf) {
            var value = rec[mf.name];
            if (value != null && value != undefined && value != "") {
                /* Format table row */
                var heading = '<strong>' + mf.caption + '</strong>';
                if (mf.type == "long_text") {
                    content += '<tr><td colspan="2" class="metadata" style="background-color: inherit">' + heading + '<div>' + magic.modules.Common.linkify(value) + '</div></td></tr>';
                } else {
                    content += '<tr><td valign="top" style="width:120px">' + heading + '</td><td class="metadata" style="width:270px">' + value + '</td></tr>';
                }                
            }
        }, this));
    } else {
        content = '<tr><td colspan="2">No metadata available</td></tr>';
    }
    content += '</table>';
    $("#attribution-metadata").html(content);
};
