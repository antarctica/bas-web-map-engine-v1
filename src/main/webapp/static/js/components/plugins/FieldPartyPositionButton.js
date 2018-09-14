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
            /* Add the fix history display row, hidden until button in row clicked */
            markup = markup + '<tr class="hidden"><td colspan="' + this.BUTTONS_PER_ROW + '"></td></tr>';
        }
    } else {
        markup = markup + "<tr><td>There are currently no active sledges this season</td></tr>"; 
    }
    markup = markup + 
            '</table>' + 
        '</div>';    
    /* Create a dropdown of inactive ones that may be activated */
    var inactiveSledges = jQuery.grep(this.PHONETIC_ALPHABET, jQuery.proxy(function(elt) {
        return(!(elt in this.featureMap));
    }, this));
    markup = markup + 
        '<div class="form-inline">' + 
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

magic.classes.FieldPartyPositionButton.prototype.assignHandlers = function() {    
    /* Assign handler to activate new sledge */
    jQuery("#btn-activate-sledge").click(jQuery.proxy(function(evt) {
        var selection = jQuery("#sel-activate-sledge").val();
        if (selection != "") {
            this.featureMap[selection] = {};
            jQuery("." + this.popoverContentClass).html(this.markup());
            this.assignHandlers();
        }
    }, this));
    /* Assign sledge fix popovers */
    jQuery(".sledge-fix-button").click(jQuery.proxy(function(idx, elt) {
        /* Show the fix history in a table below the button */
        var clickedSledge = jQuery(elt).text();
        var historyRow = jQuery(elt).closest("tr").next("tr");
        var fixes = Object.keys(this.featureMap[clickedSledge]);
        fixes.sort();
        if (historyRow.length > 0) {
            var historyTd = historyRow.children().first();
            var fixMarkup = 
                '<table class="table" style="max-height:200px">' + 
                    '<tr><th>Date</th><th>No ppl</th><th>Updater</th><th>Lat</th><th>Lon</th><th>Ht</th><th>Notes</th></tr>' + 
                    '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
            for (var i = fixes.length-1; i >= 0; i--) {
                fixMarkup = fixMarkup + '<tr>';
                var feat = this.featureMap[clickedSledge][fixes[i]];
                var props = feat.getProperties();
                fixMarkup = fixMarkup + 
                    '<td align="right">' + magic.modules.Common.dateFormat(props.fix_date, "dmy") + '</td>' + 
                    '<td align="right">' + (isNaN(props.people_count) ? "" : props.people_count) + '</td>' + 
                    '<td align="right">' + (props.updater || "") + '</td>' + 
                    '<td align="right">' + magic.modules.GeoUtils.applyPref("coordinates", props.lat, "lat") + '</td>' + 
                    '<td align="right">' + magic.modules.GeoUtils.applyPref("coordinates", props.lon, "lon") + '</td>' + 
                    '<td align="right">' + (isNaN(props.height) ? "" : props.height) + '</td>' + 
                    '<td>' + props.notes + '</td>';                            
                fixMarkup = fixMarkup + '</tr>';
            }
            fixMarkup = fixMarkup + '</table>';
            historyTd.removeClass("hidden");
            historyTd.html(fixMarkup);
        }        
    }, this));
};


