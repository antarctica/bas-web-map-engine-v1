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
    
    this.loadFeatures();
};

/**
 * Load up the WFS features
 */
magic.classes.FieldPartyPositionButton.prototype.loadFeatures = function() {
    
    jQuery(".field-party-popover-content").find("form")[0].reset();
    magic.modules.Common.resetFormIndicators();
    this.featureMap = {};   
    this.formEdited = false;    
    this.savedState = null;
                
    jQuery.ajax({
        url: this.WFS_FETCH,
        method: "GET",
        success: jQuery.proxy(function(data) {
            var fmtGeoJson = new ol.format.GeoJSON({
                geometryName: "geometry"
            });          
            var feats = fmtGeoJson.readFeatures(data);
            /* Now classify the features by name and fix date */
            var noDupFeats = [], trackFeats = [];
            console.log("Read " + feats.length + " features");
            jQuery.each(feats, jQuery.proxy(function(idx, f) {
                var attrs = f.getProperties();
                var fname = attrs.sledge;
                var fdate = attrs.fix_date;
                if (!this.featureMap[fname]) {
                    this.featureMap[fname] = {};
                }
                if (this.featureMap[fname][fdate]) {
                    /* Sometimes we get infelicities in the data => duplicate records in every way except id */
                    console.log("Duplicate found for " + fname + " at " + fdate);
                    console.log("Features with id " + attrs["id"] + " and " + this.featureMap[fname][fdate].getProperties()["id"]);
                    console.log("Ignoring...");
                } else {
                    this.featureMap[fname][fdate] = f; 
                    noDupFeats.push(f);
                }
            }, this));
            /* Now write styling hints into the feature attributes */
            console.log(noDupFeats.length + " features are non-duplicates");
            jQuery.each(this.featureMap, jQuery.proxy(function(k, v) {               
                var fixes = Object.keys(v);
                fixes.sort();
                fixes.reverse();
                /* Initialise the line track feature */
                var track = new ol.geom.LineString([], "XY");
                /* Now have descending order array of fixes */
                var colourStep = 255/fixes.length;
                for (var i = 0; i < fixes.length; i++) {
                    var rgba = "rgba(" + parseInt(255 - i*colourStep) + ",0," + parseInt(i*colourStep) + ",1.0)";
                    var fixFeat = v[fixes[i]];
                    fixFeat.setProperties({
                        "rgba": rgba, 
                        "latest": i == 0, 
                        "highlighted": false,                        
                        "__layer": this.layer
                    }, true);
                    fixFeat.setStyle(magic.modules.VectorStyles["bas_field_party"]());
                    track.appendCoordinate(fixFeat.getGeometry().getFirstCoordinate());
                }
                /* Create track feature and style */
                var trackFeat = new ol.Feature({
                    "name": k,
                    "palette_index": trackFeats.length,
                    "_ignoreHovers": true,
                    "geometry": track
                });
                trackFeat.setStyle(magic.modules.VectorStyles["bas_field_party"]());
                trackFeats.push(trackFeat);
            }, this));
            this.layer.getSource().clear();
            this.layer.getSource().addFeatures(trackFeats);
            this.layer.getSource().addFeatures(noDupFeats);
            /* Activate the help button */
            jQuery(".fix-editing-help").popover({
                placement: "right",
                trigger: "focus",
                content: "You can add, edit and remove positional fixes.  All red labelled fields are required. Edit an existing fix by clicking on the relevant icon on the map"
            });
            /* Convert the sledge input field to combobox */
            this.initSledgeCombobox("fix-input-sledge", Object.keys(this.featureMap).sort());
            /* Convert the date input field to a datepicker */
            this.initDatepicker("fix-input-fix_date");            
            /* Assign the new button handler */
            jQuery("#fix-new").off("click").on("click", jQuery.proxy(this.resetForm, this));
            /* Assign the save button handler */
            jQuery("#fix-save-go").off("click").on("click", jQuery.proxy(this.saveForm, this));            
            /* Assign the delete button handler */
            jQuery("#fix-delete-go").off("click").on("click", jQuery.proxy(this.deleteFix, this));
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
    this.featureMap = {};    
    this.formEdited = false;    
    this.savedState = null;
};

/**
 * Reset the form, taking account of whether or not it has been edited
 */
magic.classes.FieldPartyPositionButton.prototype.resetForm = function() {  
    magic.modules.Common.resetFormIndicators();
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

/**
 * Delete a positional fix
 */
magic.classes.FieldPartyPositionButton.prototype.deleteFix = function() {  
    var delId = jQuery("#fix-input-id").val();
    if (!isNaN(parseInt(delId))) {
        /* Identifier is plausible */
        this.confirmOperation(jQuery.proxy(function (result) {
            if (result) {                
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/fpp/delete/" + delId,
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")              
                    },
                    success: jQuery.proxy(function() {
                        jQuery(".field-party-popover-content").find("form")[0].reset();
                        this.loadFeatures();
                    }, this),
                    error: function(xhr) {
                        var errmsg = "Failed to delete fix - no further information available";
                        try {
                            var resp = JSON.parse(xhr.responseText);
                            errmsg = "Status " + resp.status + " deleting fix - details : " + resp.detail;
                        } catch (e) {}
                        magic.modules.Common.buttonClickFeedback("fix-delete", false, errmsg);
                    }
                });                            
            }                  
            this.formEdited = false;
        }, this), function() {
        });            
    }    
};

/**
 * Save the form data - NOTE: should eventually use WFS-T rather than same-server database ops - David 2018-10-03
 */
magic.classes.FieldPartyPositionButton.prototype.saveForm = function() {    
    var payload = this.getPayload();
    console.log(payload);
    if (this.validate(payload)) {
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/fpp/" + (payload.id ? "update/" + payload.id : "save"),
            method: payload.id ? "PUT" : "POST",
            processData: false,
            data: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
            },
            success: jQuery.proxy(function() {                
                this.loadFeatures();
                magic.modules.Common.buttonClickFeedback("fix-save", true, "Ok");
            }, this),
            error: function(xhr) {
                var errmsg = "Failed to save edits - no further information available";
                try {
                    var resp = JSON.parse(xhr.responseText);
                    errmsg = "Status " + resp.status + " saving edits - details : " + resp.detail;
                } catch (e) {}
                magic.modules.Common.buttonClickFeedback("fix-save", false, errmsg);
            }
        });        
    } else {
        magic.modules.Common.buttonClickFeedback("fix-save", false, "Errors found");
    }
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
        "id": jQuery("#fix-input-id").val(),
        "season": this.computeSeason(),
        "sledge": this.getComboboxValue("fix-input-sledge"),
        "fix_date": this.getDatepickerValue("fix-input-fix_date"),
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
    jQuery("#fix-input-id").val(payload.id || "");
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
magic.classes.FieldPartyPositionButton.prototype.initSledgeCombobox = function(id, opts) {
    var cbSelect = jQuery("#" + id);
    if (cbSelect.length > 0) {
        /* The input exists (we must therefore be admin) */
        cbSelect.empty();        
        cbSelect.append(jQuery('<option>', {value: "", text: ""}));
        /* Active sledges */
        var doneOptions = {};
        for (var j = 0; j < opts.length; j++) {           
            cbSelect.append(jQuery('<option>', {value: opts[j], text: opts[j]}));
            doneOptions[opts[j]] = true;
        }
        /* Others from the phonetic alphabet */        
        for (var i = 0; i < this.PHONETIC_ALPHABET.length; i++) {
            var designator = this.PHONETIC_ALPHABET[i];
            if (doneOptions[designator] !== true) {
                cbSelect.append(jQuery('<option>', {value: designator, text: designator}));
            }
        }
        if (!cbSelect.hasClass("combobox")) {
            /* The input has not been converted */
            cbSelect.addClass("combobox");
            cbSelect.combobox({
                appendId: "-input",
                highlighter: function(item) { 
                    return('<div style="width:100%;background-color:' + (doneOptions[item] === true ? '#99cc00' : '#993300') + '"><strong>' + item + '</strong></div>');
                }
            });
            var cbInput = jQuery("#" + id + "-input");
            cbInput.attr("required", cbSelect.attr("required"));
            cbInput.attr("data-toggle", "tooltip");
            cbInput.attr("data-placement", "right");
            cbInput.attr("title", cbSelect.attr("title"));
            /* Change backgrounds for list elements to indicate active/inactive */
            jQuery("ul.typeahead").find('li[data-value != ""]').each(function(idx, elt) {
                var designator = jQuery(elt).data("value");
                if (designator != "") {
                    if (doneOptions[designator] === true) {
                        /* Active sledge */
                        jQuery(elt).css("background-color", "#DFF0D8");
                    } else {
                        /* Yet to be activated one */
                        jQuery(elt).css("background-color", "#F2DEDE");
                    }
                }
            });
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
    this.layer.getSource().forEachFeature(function(f) {
        f.setProperties({
            highlighted: false
        });
        f.setStyle(magic.modules.VectorStyles["bas_field_party"]());                
    });
    magic.runtime.map.forEachFeatureAtPixel(evt.pixel, jQuery.proxy(function(feat, layer) {
        if (layer == this.layer && feat.getGeometry().getType() == "Point") {
            /* Change feature style to indicate selection */
            feat.setProperties({
                highlighted: true
            });
            feat.setStyle(magic.modules.VectorStyles["bas_field_party"]());
            this.confirmOperation(
                jQuery.proxy(function(result) {
                    if (result) {
                        this.saveForm();
                    } 
                    this.setPayload(feat.getProperties());
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