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
    
    this.clickedSledge = null;//DELETE
    
    /* Flag whether all extra JS and CSS have been loaded */
    this.extraResourcesLoaded = false;
   
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
        if (!this.extraResourcesLoaded) {
            /* Stylesheets */
            jQuery("head").append(
                '<link href="' + magic.config.paths.cdn + '/css/bootstrap-combobox/1.1.6-font-awesome/bootstrap-combobox.min.css" rel="stylesheet" type="text/css">'
            );
            jQuery("head").append(
                '<link href="' + magic.config.paths.cdn + '/css/bootstrap-datetimepicker/4.17.47/bootstrap-datetimepicker.min.css" rel="stylesheet" type="text/css">'
            );
            /* Javascript resources */
            jQuery("head").append(
                '<script type="text/javascript" src="' + 
                    magic.config.paths.cdn + '/js/bootstrap-combobox/1.1.6-font-awesome/bootstrap-combobox.min.js">' + 
                '</script>'
            );
            jQuery("head").append(
                '<script type="text/javascript" src="' + 
                    magic.config.paths.cdn + '/js/bootstrap-datetimepicker/4.17.47/bootstrap-datetimepicker.min.js">' + 
                '</script>'
            );
            this.extraResourcesLoaded = true;
        }
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/fpp/layout",
            dataType: "html",
            success: jQuery.proxy(function(markup) {
                jQuery(".field-party-popover-content").html(markup);
                this.activate();
            }, this),
            error: function() {
                jQuery(".field-party-popover-content").html("Failed to retrieve content for pop-up");
            }
        });                     
    }, this));                
    
};

magic.classes.FieldPartyPositionButton.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.FieldPartyPositionButton.prototype.constructor = magic.classes.FieldPartyPositionButton;

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
 * Display markup for a positional fix
 */
//magic.classes.FieldPartyPositionButton.prototype.displayFix = function() {
//    jQuery("#sledge-fix-display-pane").find("td").empty();
//    if (this.displayedFixIndex != -1) {
//        var fix = this.featureMap[this.clickedSledge][this.fixes[this.displayedFixIndex]];
//        var nameStem = "fix-td-";
//        jQuery("#" + nameStem + "fix_date").html(magic.modules.Common.dateFormat(fix.fix_date, "dmy"));
//        jQuery("#" + nameStem + "people_count").html((isNaN(parseInt(fix.people_count)) ? "" : fix.people_count));
//        jQuery("#" + nameStem + "updater").html((fix.updater || ""));
//        jQuery("#" + nameStem + "lat").html(magic.modules.GeoUtils.applyPref("coordinates", fix.lat, "lat"));
//        jQuery("#" + nameStem + "lon").html(magic.modules.GeoUtils.applyPref("coordinates", fix.lon, "lon"));
//        jQuery("#" + nameStem + "height").html((isNaN(parseFloat(fix.height)) ? "" : fix.height));
//        jQuery("#" + nameStem + "notes").html((fix.notes || ""));
//    }    
//};

