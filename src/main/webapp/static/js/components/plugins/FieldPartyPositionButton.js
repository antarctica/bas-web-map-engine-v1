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
    
    this.formEdited = false;
    
    this.savedState = null;
   
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
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/fpp/layout",
            dataType: "html",
            success: jQuery.proxy(function(markup) {
                /* Icons for the date picker widget */ 
                jQuery.fn.datetimepicker.defaults.icons = {
                    clear: "fa fa-trash",
                    close: "fa fa-times",
                    date: "fa fa-calendar",
                    down: "fa fa-chevron-down",
                    next: "fa fa-chevron-right",
                    previous: "fa fa-chevron-left",
                    time: "fa fa-time",
                    today: "fa fa-asterisk",
                    up: "fa fa-chevron-up"
                };
                var popoverDiv = jQuery(".field-party-popover-content");
                popoverDiv.html(markup);            
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
    this.savedState = this.getPayload();
};

magic.classes.FieldPartyPositionButton.prototype.restoreState = function() {
    if (this.savedState != null) {
        this.setPayload(this.savedState);
        this.savedState = null;
    }
};

magic.classes.FieldPartyPositionButton.prototype.onActivate = function() { 
    
    magic.runtime.featureinfotool.deactivate();
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery(".field-party-popover-content").find("form :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
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
                    v[fixes[i]].setProperties({"rgba": rgba, "__layer": this.layer}, true);
                    v[fixes[i]].setStyle(magic.modules.VectorStyles["bas_field_party"]());
                }
            }, this));
            this.layer.getSource().clear();
            this.layer.getSource().addFeatures(feats);
            /* Activate the help button */
            jQuery(".fix-editing-help").popover({
                placement: "right",
                trigger: "focus",
                content: "You can add, edit and remove positional fixes.  All red labelled fields are required. Edit an existing fix by clicking on the relevant icon on the map"
            });
            /* Convert the sledge input field to combobox */
            this.initCombobox("fix-input-sledge", Object.keys(this.featureMap).sort());
            /* Convert the date input field to a datepicker */
            this.initDatepicker("fix-input-fix_date");
            /* Assign the save button handler */
            jQuery("#fix-save-go").off("click").on("click", jQuery.proxy(function(evt) {
                var payload = this.getPayload();
                if (this.validate(payload)) {
                    this.saveForm();
                    magic.modules.Common.buttonClickFeedback("fix-save", true, "Ok");
                } else {
                    magic.modules.Common.buttonClickFeedback("fix-save", false, "Errors found");
                }
            }, this));
            /* Assign the cancel button handler */
            jQuery("#fix-save-cancel").off("click").on("click", jQuery.proxy(this.resetForm, this));
            /* Assign the feature click-to-edit handler */
            magic.runtime.map.un("singleclick", this.clickToEditHandler, this);
            magic.runtime.map.on("singleclick", this.clickToEditHandler, this);
            /* Restore any saved state */
            this.restoreState();
        }, this),
        error: function() {
            console.log("Failed to get field party positional data - potential network outage?");
        }
    });   
};

magic.classes.FieldPartyPositionButton.prototype.onDeactivate = function() {  
    magic.runtime.featureinfotool.activate();
    this.target.popover("hide");
    magic.runtime.map.un("singleclick", this.clickToEditHandler, this);
};

/**
 * Reset the form, taking account of whether or not it has been edited
 */
magic.classes.FieldPartyPositionButton.prototype.resetForm = function() {    
    this.confirmOperation(jQuery.proxy(function (result) {
        if (result) {                
            this.saveForm();                    
        }      
        jQuery(".field-party-popover-content").find("form")[0].reset();
        this.formEdited = false;
    }, this), function() {
        jQuery(".field-party-popover-content").find("form")[0].reset();
    });    
};

magic.classes.FieldPartyPositionButton.prototype.saveForm = function() {
    console.log(this.getPayload());
};

/**
 * Confirm an operation on a potentially edited form, and execute a callback accordingly
 * @param {Function} callbackEdited
 * @param {Function} callbackNotEdited
 */
magic.classes.FieldPartyPositionButton.prototype.confirmOperation = function(callbackEdited, callbackNotEdited) {
    if (this.formEdited) {
        /* Ask for user confirmation when form has been edited */
        if (!jQuery.isFunction(callbackEdited)) {
            callbackEdited = function(){};
        }
        bootbox.confirm({
            message: "Unsaved edits - save before clearing form?",
            buttons: {
                confirm: {
                    label: "Yes",
                    className: "btn-success"
                },
                cancel: {
                    label: "No",
                    className: "btn-danger"
                }
            }, callback: callbackEdited});
    } else {
        if (jQuery.isFunction(callbackNotEdited)) {
            callbackNotEdited();
        }
    }
};

/**
 * Retrieve the form's value as a JSON object
 * @returns {Object}
 */
magic.classes.FieldPartyPositionButton.prototype.getPayload = function() {    
    return({
        "season": this.computeSeason(),
        "sledge": this.getComboboxValue("fix-input-sledge"),
        "date": this.getDatepickerValue("fix-input-fix_date"),
        "people_count": jQuery("#fix-input-people_count").val(),
        "updater": jQuery("#fix-input-updater").val(),
        "lat": magic.modules.GeoUtils.toDecDegrees(jQuery("#fix-input-lat").val()),
        "lon": magic.modules.GeoUtils.toDecDegrees(jQuery("#fix-input-lon").val()),
        "height": jQuery("#fix-input-height").val(),
        "notes": jQuery("#fix-input-notes").val()
    });
};

/**
 * Set the form's value to the given JSON object
 * @param {Object} payload
 */
magic.classes.FieldPartyPositionButton.prototype.setPayload = function(payload) {  
    this.setComboboxValue("fix-input-sledge", payload.sledge);
    this.setDatepickerValue("fix-input-fix_date", payload.fix_date);
    jQuery("#fix-input-people_count").val(payload.people_count);
    jQuery("#fix-input-updater").val(payload.updater || "");
    jQuery("#fix-input-lat").val(magic.modules.GeoUtils.applyPref("coordinates", payload.lat, "lat"));
    jQuery("#fix-input-lon").val(magic.modules.GeoUtils.applyPref("coordinates", payload.lon, "lon"));
    jQuery("#fix-input-height").val(payload.height || 0.0);
    jQuery("#fix-input-notes").val(payload.notes || "");
};

/**
 * Validate the form inputs
 * @param {Object} payload
 * @returns {boolean}
 */
magic.classes.FieldPartyPositionButton.prototype.validate = function(payload) { 
    var valid = false;
    magic.modules.Common.resetFormIndicators();
    if (payload) {
        valid = true;
        if (payload.sledge == null || payload.sledge == "") {
            magic.modules.Common.flagInputError(jQuery("#fix-input-sledge-input"));
            valid = false;
        }
        if (payload.fix_date == null || payload.fix_date == "") {
            magic.modules.Common.flagInputError(jQuery("#fix-input-fix_date"));
            valid = false;
        }
        if (payload.people_count == null || payload.people_count == "") {
            magic.modules.Common.flagInputError(jQuery("#fix-input-people_count"));
            valid = false;
        }
        if (payload.updater == null || payload.updater == "") {
            magic.modules.Common.flagInputError(jQuery("#fix-input-updater"));
            valid = false;
        }
        if (payload.lat == null || payload.lat == "" || isNaN(payload.lat)) {
            magic.modules.Common.flagInputError(jQuery("#fix-input-lat"));
            valid = false;
        }
        if (payload.lon == null || payload.lon == "" || isNaN(payload.lon)) {
            magic.modules.Common.flagInputError(jQuery("#fix-input-lon"));
            valid = false;
        }
    }
    return(valid);
};

/**
 * Set up a combobox style of dropdown field (standard in the formwidgets library)
 * @param {String} id
 * @param {Object} opts
 */
magic.classes.FieldPartyPositionButton.prototype.initCombobox = function(id, opts) {
    var cbSelect = jQuery("#" + id);
    if (cbSelect.length > 0) {
        /* The input exists (we must therefore be admin) */
        cbSelect.empty();
        cbSelect.append(jQuery('<option>', {value: "", text: ""}));
        for (var j = 0; j < opts.length; j++) {           
            cbSelect.append(jQuery('<option>', {value: opts[j], text: opts[j]}));
        }
        if (!cbSelect.hasClass("combobox")) {
            /* The input has not been converted */
            cbSelect.addClass("combobox");
            cbSelect.combobox({
                appendId: "-input"
            });
            var cbInput = jQuery("#" + id + "-input");
            cbInput.attr("required", cbSelect.attr("required"));
            cbInput.attr("data-toggle", "tooltip");
            cbInput.attr("data-placement", "right");
            cbInput.attr("title", cbSelect.attr("title"));
        }        
    }    
};

/**
 * Set up a datepicker field (standard in the formwidgets library)
 * @param {String} id
 */
magic.classes.FieldPartyPositionButton.prototype.initDatepicker = function(id) {
    var dtInput = jQuery("#" + id).closest(".input-group");
    if (dtInput.length > 0) {
        dtInput.addClass("date");
        dtInput.datetimepicker({
            viewMode: "days",
            format: "DD/MM/YYYY"
        });
    }
};

/**
 * Set the value of a combobox field
 * @param {String} id
 * @param {String} value
 */
magic.classes.FieldPartyPositionButton.prototype.setComboboxValue = function(id, value) {
    var cbSelect = jQuery("#" + id);
    if (cbSelect.length > 0) {
        /* The input exists, so we must be admin */
        var cbInput = jQuery("#" + id + "-input");
        var cbHidden = cbInput.closest("div.combobox-container").find("input[type='hidden']");
        cbHidden.val(value);
        /* Activate the corresponding drop-down item (if none, a free-form text string was entered) */
        var selOpt = jQuery("#" + id).find("option[value='" + value + "']");
        if (selOpt.length > 0) {
            /* Activate drop-down element */
            cbInput.val(selOpt.prop("text"));
        }
    }
};

/**
 * Set the value of a datepicker field
 * @param {String} id
 * @param {String} value
 */
magic.classes.FieldPartyPositionButton.prototype.setDatepickerValue = function(id, value) {
    jQuery("#" + id).val(moment(value).format("DD/MM/YYYY"));
};

/**
 * Get the current value of a combobox field
 * @param {String} id
 * @return {String}
 */
magic.classes.FieldPartyPositionButton.prototype.getComboboxValue = function(id) {
    var cbInput = jQuery("#" + id + "-input");
    var cbHidden = cbInput.closest("div.combobox-container").find("input[type='hidden']");
    return(cbHidden.val());
};

/**
 * Get the current value of a datepicker field
 * @param {String} id
 * @return {String}
 */
magic.classes.FieldPartyPositionButton.prototype.getDatepickerValue = function(id) {
    var field = jQuery("#" + id);
    return(field.val() ? moment(field.val(), "DD/MM/YYYY").format("YYYY-MM-DD") : "");
};

/**
 * Handle a feature click by moving the attributes to the edit form
 * @param {jQuery.Event} evt
 */
magic.classes.FieldPartyPositionButton.prototype.clickToEditHandler = function(evt) {
    magic.runtime.map.forEachFeatureAtPixel(evt.pixel, jQuery.proxy(function(feat, layer) {
        if (layer == this.layer) {
            this.confirmOperation(
                jQuery.proxy(function(result) {
                    if (result) {
                        this.setPayload(feat.getProperties());
                    }
                }, this), 
                jQuery.proxy(function() {
                    this.setPayload(feat.getProperties());
                }, this)
            );            
            return(true);
        }
        return(false);
    }, this));
};

/**
 * Get the current season in the form "1819" based on the given date, or the current date if not supplied
 * @param {String} currentDateStr
 * @return {String}
 */
magic.classes.FieldPartyPositionButton.prototype.computeSeason = function(currentDateStr) {
    var currentDate, thisYear;
    if (!currentDateStr) {
        currentDate = Date.now();
        thisYear = new Date().getFullYear();
    } else {
        currentDate = Date.parse(currentDateStr);
        thisYear = new Date(currentDateStr).getFullYear();
    }
    if (!isNaN(currentDate)) {
        if (currentDate < Date.parse(thisYear + "-10-01 00:00:00")) {
            return((thisYear-1).toString().substring(2) + thisYear.toString().substring(2));
        } else {
            return(thisYear.toString().substring(2) + (thisYear+1).toString().substring(2));
        }
    } 
    return("");
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

