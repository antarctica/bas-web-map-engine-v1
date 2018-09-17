/* Dashboard of Field Party positions (BLIP) as a Bootstrap popover */

magic.classes.FieldPartyPositionButton = function (options) {
    
    /* ICAO Phonetic Aphabet (English spellings) */
    this.PHONETIC_ALPHABET = [
        "Alpha", "Bravo", "Charlie", "Delta", 
        "Echo", "Foxtrot", "Golf", "Hotel", 
        "India", "Juliett", "Kilo", "Lima", 
        "Mike", "November", "Oscar", "Papa", 
        "Quebec", "Romeo", "Sierra", "Tango", 
        "Uniform", "Victor", "Whiskey", "X-ray", 
        "Yankee", "Zulu"  
    ];
    
    /* How many buttons we want in each row */
    this.BUTTONS_PER_ROW = 4;
    
    /* Data fetch */
    this.WFS_FETCH = "http://mapengine-dev.nerc-bas.ac.uk:8080/geoserver/opsgis2/wfs?service=wfs&request=getfeature&version=2.0.0&" + 
            "typeNames=opsgis2:ops_field_deployments&outputFormat=json&sortBy=fix_date+D&cql_filter=season=1819";
   
    /**
     * Classified feature map, so that heatmap styling can be applied
     * {
     *     <sledge_name> : {
     *         <fix1> : <feature1>,
     *         <fix2> : <feature2>,
     *         ...
     *         <fixn> : <featuren>
     *     }
     * }
     */
    this.featureMap = {};
    
    this.clickedSledge = null;
   
    magic.classes.NavigationBarTool.call(this, options);    
    
    /* Control callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivate, this),
        onDeactivate: jQuery.proxy(this.onDeactivate, this), 
        onMinimise: jQuery.proxy(this.saveState, this)
    });
    
    this.layer.set("metadata", {
        is_interactive: true,
        attribute_map: [
            {name: "sledge", alias: "Sledge", displayed: true},
            {name: "season", alias: "Season", displayed: false},
            {name: "fix_date", alias: "Fix at", displayed: true},
            {name: "updated", alias: "Updated", displayed: false},
            {name: "updater", alias: "By", displayed: true},
            {name: "lat", alias: "Lat", displayed: true},
            {name: "lon", alias: "Lon", displayed: true},
            {name: "height", alias: "Altitude", displayed: false},
            {name: "notes", alias: "Notes", displayed: true}
        ]                    
    });
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: "Loading field party data..."
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate();               
    }, this));                
    
};

magic.classes.FieldPartyPositionButton.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.FieldPartyPositionButton.prototype.constructor = magic.classes.FieldPartyPositionButton;

magic.classes.FieldPartyPositionButton.prototype.markup = function() {
    var markup = "";
    /* Get the active sledges */
    var activeSledges = Object.keys(this.featureMap);
    activeSledges.sort();
    /* Create the "app style" buttons for active sledges */
    markup = markup + 
        '<div id="active-sledge-button-pane">' + 
            '<table class="table">';
    if (activeSledges.length > 0) {
        var nRows = Math.ceil(activeSledges.length/this.BUTTONS_PER_ROW);
        for (var i = 0; i < nRows; i++) {
            markup = markup + '<tr>';
            var btnIndex = i*this.BUTTONS_PER_ROW;
            for (var j = 0; btnIndex+j < activeSledges.length && j < this.BUTTONS_PER_ROW; j++) {
                markup = markup + 
                    '<td>' + 
                        '<button type="button" class="btn btn-success btn-sm sledge-fix-button" style="width:80px">' + 
                            activeSledges[btnIndex+j] + 
                        '</button>' + 
                    '</td>';
            }
            markup = markup + '</tr>';            
        }
    } else {
        markup = markup + "<tr><td>There are currently no active sledges this season</td></tr>"; 
    }
    markup = markup + 
            '</table>' + 
        '</div>';    
    /* Create the sledge activation control - a dropdown of inactive ones that may be activated */
    var inactiveSledges = jQuery.grep(this.PHONETIC_ALPHABET, jQuery.proxy(function(elt) {
        return(!(elt in this.featureMap));
    }, this));
    markup = markup + 
        '<div id="activate-sledge-control-pane" class="form-inline">' + 
            '<div class="form-group form-group-sm">' + 
                '<select class="form-control" id="sel-activate-sledge">' + 
                    '<option value="">Select a sledge to activate</option>';
    for (var i = 0; i < inactiveSledges.length; i++) {
        markup = markup + '<option value="' + inactiveSledges[i] + '">' + inactiveSledges[i] + '</option>';
    }
    markup = markup + 
                '</select>' +                 
            '</div>' + 
            '<button id="btn-activate-sledge" type="button" class="btn btn-primary btn-sm">Activate</button>' + 
        '</div>';    
    /* Create the sledge fix display pane */
    markup = markup + 
        '<div id="sledge-fix-display-pane" class="hidden">' + 
            '<table class="table table-striped table-condensed" style="width:100%">' + 
                '<tr><th width="20%">Date</th><td id="fix-td-fix_date" width="80%" align="right"></td></tr>' + 
                '<tr><th>Ppl</th><td id="fix-td-people_count" align="right"></td></tr>' + 
                '<tr><th>Updater</th><td id="fix-td-updater" align="right"></td></tr>' + 
                '<tr><th>Lat</th><td id="fix-td-lat" align="right"></td></tr>' + 
                '<tr><th>Lon</th><td id="fix-td-lon" align="right"></td></tr>' + 
                '<tr><th>Ht</th><td id="fix-td-height" align="right"></td></tr>' + 
                '<tr><th>Notes</th><td id="fix-td-notes"></td></tr>' + 
            '</table>' + 
            '<div class="btn-toolbar" role="toolbar">' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="sledge-fix-pager-first" type="button" class="btn btn-default btn-sm">' + 
                        '<span class="fa fa-angle-double-left" data-toggle="tooltip" data-placement="top" title="First fix"></span>' + 
                    '</button>' + 
                    '<button id="sledge-fix-pager-prev" type="button" class="btn btn-default btn-sm">' + 
                        '<span class="fa fa-angle-left" data-toggle="tooltip" data-placement="top" title="Previous fix"></span>' + 
                    '</button>' + 
                    '<button type="button" class="btn btn-default btn-sm sledge-fix-display-xofy">No fixes</button>' + 
                    '<button id="sledge-fix-pager-next" type="button" class="btn btn-default btn-sm">' + 
                        '<span class="fa fa-angle-right" data-toggle="tooltip" data-placement="top" title="Next fix"></span>' + 
                    '</button>' + 
                    '<button id="sledge-fix-pager-last" type="button" class="btn btn-default btn-sm">' + 
                        '<span class="fa fa-angle-double-right" data-toggle="tooltip" data-placement="top" title="Last fix"></span>' + 
                    '</button>' + 
                '</div>' + 
                '<div class="btn-group" role="group">' + 
                    '<button id="sledge-fix-pager-new" type="button" class="btn btn-primary btn-sm">' + 
                        '<span class="fa fa-star" data-toggle="tooltip" data-placement="top" title="Add a new fix"></span>' + 
                    '</button>' + 
                    '<button id="sledge-fix-pager-save" type="button" class="btn btn-primary btn-sm">' + 
                        '<span class="fa fa-floppy-o" data-toggle="tooltip" data-placement="top" title="Save fix"></span>' + 
                    '</button>' + 
                    '<button id="sledge-fix-pager-del" type="button" class="btn btn-danger btn-sm">' + 
                        '<span class="fa fa-times" data-toggle="tooltip" data-placement="top" title="Delete fix"></span>' + 
                    '</button>' +                
                '</div>' + 
            '</div>' +  
        '</div>';
    return(markup);    
};

magic.classes.FieldPartyPositionButton.prototype.interactsMap = function () {
    return(true);
};

magic.classes.FieldPartyPositionButton.prototype.saveState = function() {
    //TODO
};

magic.classes.FieldPartyPositionButton.prototype.restoreState = function() {
    //TODO
};

magic.classes.FieldPartyPositionButton.prototype.onActivate = function() {       
    jQuery.ajax({
        url: this.WFS_FETCH,
        method: "GET",
        success: jQuery.proxy(function(data) {
            var fmtGeoJson = new ol.format.GeoJSON({
                geometryName: "geometry"
            });          
            var feats = fmtGeoJson.readFeatures(data);
            /* Now classify the features by name and fix date */
            jQuery.each(feats, jQuery.proxy(function(idx, f) {
                var attrs = f.getProperties();
                var fname = attrs.sledge;
                var fdate = attrs.fix_date;
                if (!this.featureMap[fname]) {
                    this.featureMap[fname] = {};
                }
                this.featureMap[fname][fdate] = f;                  
            }, this));
            /* Now write styling hints into the feature attributes */
            jQuery.each(this.featureMap, jQuery.proxy(function(k, v) {               
                var fixes = Object.keys(v);
                fixes.sort();
                fixes.reverse();
                /* Now have descending order array of fixes */
                var colourStep = 255/fixes.length;
                for (var i = 0; i < fixes.length; i++) {
                    var rgba = "rgba(" + parseInt(255 - i*colourStep) + ",0," + parseInt(i*colourStep) + ",1.0)";
                    v[fixes[i]].setProperties({"rgba": rgba}, true);
                    v[fixes[i]].setStyle(magic.modules.VectorStyles["bas_field_party"]());
                }
            }, this));
            this.layer.getSource().clear();
            this.layer.getSource().addFeatures(feats);
            /* Update the popover content with fix information */
            jQuery("." + this.popoverContentClass).html(this.markup());
            /* Assign handler to activate new sledge */
            jQuery("#btn-activate-sledge").click(jQuery.proxy(function(evt) {
                var selection = jQuery("#sel-activate-sledge").val();
                if (selection != "") {
                    this.featureMap[selection] = {};
                    var popoverDiv = jQuery("." + this.popoverContentClass);
                    popoverDiv.empty();
                    popoverDiv.html(this.markup());
                    this.assignHandlers();
                }
            }, this));
            this.assignHandlers();
        }, this),
        error: function() {
            console.log("Failed to get field party positional data - potential network outage?");
        }
    });   
};

magic.classes.FieldPartyPositionButton.prototype.onDeactivate = function() {    
    this.target.popover("hide");
};

/**
 * Assign button click handlers to show fix history
 */
magic.classes.FieldPartyPositionButton.prototype.assignHandlers = function() {            
    jQuery(".sledge-fix-button").off("click").on("click", jQuery.proxy(function(evt) {
        jQuery("#sledge-fix-display-pane").removeClass("hidden");
        this.clickedSledge = jQuery(evt.currentTarget).text();
        this.fixes = Object.keys(this.featureMap[this.clickedSledge]);
        this.fixes.sort();   /* By date ascending */
        this.displayedFixIndex = this.fixes.length-1;
        this.displayFix();
        this.buttonStatuses();
        /* Assign handlers */
        jQuery("[id^='sledge-fix-pager-']").off("click").on("click", jQuery.proxy(function(evt) {
            var btnId = evt.currentTarget.id.replace("sledge-fix-pager-", "");
            switch(btnId) {
                case "first":
                    this.displayedFixIndex = 0;
                    break;
                case "prev":
                    if (this.displayedFixIndex > 0) {
                        this.displayedFixIndex--;
                    }                    
                    break;
                case "next":
                    if (this.displayedFixIndex < this.fixes.length-1) {
                        this.displayedFixIndex++;
                    }    
                    break;
                case "last":
                    this.displayedFixIndex = this.fixes.length-1;
                    break;
                case "new":
                    break;
                case "save":
                    break;
                case "del":
                    break;
                default:
                    break;
            }
            this.displayFix();
        }, this));
    }, this));
};

magic.classes.FieldPartyPositionButton.prototype.buttonStatuses = function() {
    var nameStem = "sledge-fix-pager-";    
    jQuery("[id^='" + nameStem + "']").addClass("disabled");
    if (this.displayedFixIndex != -1 && this.fixes.length > 0) {
        var btnFirst = jQuery("#" + nameStem + "-first");
        var btnPrev = jQuery("#" + nameStem + "-prev");
        var btnNext = jQuery("#" + nameStem + "-next");
        var btnLast = jQuery("#" + nameStem + "-last");
        if (this.displayedFixIndex > 0) {
            btnFirst.removeClass("disabled");
            btnPrev.removeClass("disabled");
        }
        if (this.displayedFixIndex < this.fixes.length-1) {
            btnNext.removeClass("disabled");
            btnLast.removeClass("disabled");
        }
        //jQuery("#" + nameStem + "-new").removeClass("disabled");
        //jQuery("#" + nameStem + "-del").removeClass("disabled");
    }
};

/**
 * Display markup for a positional fix
 */
magic.classes.FieldPartyPositionButton.prototype.displayFix = function() {
    jQuery("#sledge-fix-display-pane").find("td").empty();
    if (this.displayedFixIndex != -1) {
        var fix = this.featureMap[this.clickedSledge][this.fixes[this.displayedFixIndex]];
        var nameStem = "fix-td-";
        jQuery("#" + nameStem + "fix_date").html(magic.modules.Common.dateFormat(fix.fix_date, "dmy"));
        jQuery("#" + nameStem + "people_count").html((isNaN(parseInt(fix.people_count)) ? "" : fix.people_count));
        jQuery("#" + nameStem + "updater").html((fix.updater || ""));
        jQuery("#" + nameStem + "lat").html(magic.modules.GeoUtils.applyPref("coordinates", fix.lat, "lat"));
        jQuery("#" + nameStem + "lon").html(magic.modules.GeoUtils.applyPref("coordinates", fix.lon, "lon"));
        jQuery("#" + nameStem + "height").html((isNaN(parseFloat(fix.height)) ? "" : fix.height));
        jQuery("#" + nameStem + "notes").html((fix.notes || ""));
    }    
};

