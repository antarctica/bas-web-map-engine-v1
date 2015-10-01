/* Attribution and legend modal dialog */

magic.classes.AttributionModal = function(options) { 
    
    /* API */
    this.target = options.target;
    this.wms = options.wms;
    
    /* Internal */
    this.layer = null;
    this.caption = "";
    this.metadataRecord = [
        {name: "abstract", caption: "Abstract", type: "text"},
        {name: "srs", caption: "Projection", type: "projection"},
        {name: "wmsfeed", caption: "OGC WMS", type: "wms"},
        {name: "keywords", caption: "Keywords", type: "stringarray", join: "<br />"},
        {name: "bboxsrs", caption: "Bounds (SRS)", type: "bbox", dp: 2},
        {name: "bboxwgs84", caption: "Bounds (WGS84)", type: "bbox", dp: 2},
        {name: "attribution", caption: "Attribution", type: "attribution"},
        {name: "metadataurl", caption: "Metadata URL", type: "metadataurl"}        
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
                                '<ul class="nav nav-pills" role="tablist">' + 
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
        $("#attribution-legend").html(this.legendMarkup());  
        $('a[href="#attribution-legend"]').tab("show");
    }, this));
    $('a[href="#attribution-legend"]').on("shown.bs.tab", $.proxy(function(evt) {
        /* Legend */
        $("#attribution-legend").html(this.legendMarkup());        
    }, this));
    $('a[href="#attribution-metadata"]').on("shown.bs.tab", $.proxy(function(evt) {
        /* Metadata */            
        $("#attribution-metadata").html(this.metadataMarkup());        
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
 * @return {string} content
 */
magic.classes.AttributionModal.prototype.legendMarkup = function() {
    var content = '<div class="attribution-legend-content">';
    if (this.layer) {
        var md = this.layer.get("metadata");
        if (md && "legendurl" in md) {
            var opts = "&legend_options=fontName:Lucida Sans Regular;fontAntiAliasing:true;fontColor:0xffffff;fontSize:6;bgColor:0x272b30;dpi:180";
            content += 
                '<div style="width:100%;background-color:#272b30">' + 
                    '<img style="padding:10px;background-color:#272b30" src="' + md.legendurl + opts + '" alt="legend" />' + 
                '</div>';               
        } else if (md && md.staticservice) {
            /* Assume there will be a PNG image of the legend required in static/images/legends/<service>.png */
            content += 
                '<div style="width:100%;background-color:#272b30">' + 
                    '<img style="padding:10px;background-color:#272b30" src="' + magic.config.paths.baseurl + '/static/images/legends/' + md.staticservice + '.png" alt="legend" />' + 
                '</div>';        
        } else {
            content += '<div class="attribution-title">No legend available</div>';
        }
    } else {
        content += '<div class="attribution-title">No layer specified</div>';
    }
    content += '</div>';
    return(content);
};

/**
 * Create the metadata markup
 * @return {string} content
 */
magic.classes.AttributionModal.prototype.metadataMarkup = function() {    
    var content = '<table id="attribution-metadata-content" class="table table-striped table-condensed metadata-table show">';
    var md = this.layer.get("metadata");
    if (md) {
        $.each(this.metadataRecord, $.proxy(function(mi, mf) {
            var value = md[mf.name];
            if (value || mf.type == "wms") {
                /* Format attribute according to record schema */
                var value = md[mf.name];
                switch(mf.type) {
                    case "text":
                        content += '<tr><td colspan="2" class="metadata" style="background-color: inherit">' + mf.caption + '<div>' + magic.modules.Common.linkify(value) + '</div></td></tr>';
                        break;
                    case "projection": 
                        content += '<tr><td>' + mf.caption + '</td><td class="metadata">' + magic.modules.GeoUtils.formatProjection(value) + '</td></tr>';
                        break;
                    case "stringarray":
                        content += '<tr><td valign="top">' + mf.caption + '</td><td class="metadata">' + value.join(mf.join) + '</td></tr>';
                        break;
                    case "bbox":
                        content += '<tr><td valign="top">' + mf.caption + '</td><td class="metadata">' + magic.modules.GeoUtils.formatBbox(value, mf.dp) + '</td></tr>';
                        break;
                    case "metadataurl":
                        if (!$.isArray(value)) {
                            value = [value];
                        }
                        var links = [];
                        $.each(value, function(mui, murl) {
                            links.push('<a href="' + murl.url + '" target="_blank">[external resource]</a>');
                        });
                        content += '<tr><td valign="top">' + mf.caption + '</td><td class="metadata">' + links.join("<br />") + '</td></tr>';
                        break;
                    case "attribution":
                        if ("source" in value && "url" in value) {
                            content += '<tr><td valign="top">' + mf.caption + '</td><td class="metadata"><a href="' + value.url + '">' + value.source + '</a></td></tr>';
                        }
                        break;
                    case "wms":
                        if (value) {
                            if (value != "none") {
                                var icon = "";
                                if (md.icon) {
                                    icon = '<img src="' + md.icon + '" alt="' + (md.typeName || "unknown") + '" />'
                                }
                                content += '<tr><td valign="top">' + icon + '&nbsp;Repository</td><td class="metadata"><a href="' + value + '" target="_blank">[download file]</a></td></tr>';
                            }
                        } else {
                            var proj = magic.runtime.projection.getCode();
                            var getMap = this.wms + "?" + 
                                "SERVICE=WMS&" + 
                                "VERSION=1.3.0&" + 
                                "REQUEST=GetMap&" + 
                                "FORMAT=image/png&" + 
                                "TRANSPARENT=true&" + 
                                "LAYERS=" + md.name + "&" + 
                                "CRS=" + proj + "&" + 
                                "SRS=" + proj + "&" + 
                                "TILED=true&" + 
                                "WIDTH=1000&" + 
                                "HEIGHT=1000&" + 
                                "STYLES=&" + 
                                "BBOX=" + magic.runtime.projection.getExtent().join(",");
                            content += '<tr><td valign="top">' + mf.caption + '</td><td class="metadata"><a href="' + getMap + '" target="_blank">[external resource]</a></td></tr>';
                        }
                        break;
                    default:                         
                        break;
                }                
            }
        }, this));
    } else {
        content = '<tr><td colspan="2">No metadata available</td></tr>';
    }
    content += '</table>';
    return(content);
};
