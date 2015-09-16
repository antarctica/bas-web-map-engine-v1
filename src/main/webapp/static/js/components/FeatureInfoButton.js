/* Get information about features */

magic.classes.FeatureInfoButton = function(name) {

    /* API property */
    this.name = name;

    /* Internal properties */
    this.active = false;

    this.inactiveTitle = "Get information about map features";
    this.activeTitle = "Click to exit feature info mode";

    this.btn = $("<button>", {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-info-circle"></span>'
    });
    this.btn.on("click", $.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));

};

magic.classes.FeatureInfoButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.FeatureInfoButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.FeatureInfoButton.prototype.activate = function () {
    
    /* Trigger mapinteractionactivated event */
    $(document).trigger("mapinteractionactivated", [this]);  
    
    this.active = true;   
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
    /* Add map click handler (NOTE: assumes first base layer is a DEM) */
    $("#map-container").css("cursor", "help");
    magic.runtime.map.on("singleclick", this.queryFeatures, this);
};

/**
 * Deactivate the control
 */
magic.classes.FeatureInfoButton.prototype.deactivate = function () {
    this.active = false;    
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
    /* Remove map click handler */
    magic.runtime.featureinfo.hide();
    $("#map-container").css("cursor", "default");
    magic.runtime.map.un("singleclick", this.queryFeatures, this);
};

/**
 * Send a GetFeatureInfo request to all point layers
 * @param {jQuery.Event} evt
 */
magic.classes.FeatureInfoButton.prototype.queryFeatures = function (evt) {    
    var gfiLayer = null, gfiParams = [];
    magic.runtime.map.getLayers().forEach(function(layer) {
        /* Weed out the clickable (interactive) layers */
        if (layer.getVisible() === true && layer.get("metadata") && layer.get("metadata")["clickable"] === true) {
            if (!gfiLayer) {
                gfiLayer = layer;
            }
            gfiParams.push(layer.getSource().getParams()["LAYERS"]);
        }
    });
    if (gfiLayer) {        
        $.getJSON(magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(gfiLayer.getSource().getGetFeatureInfoUrl(
            evt.coordinate, 
            magic.runtime.map.getView().getResolution(), 
            magic.runtime.map.getView().getProjection(),
            {
                "LAYERS": gfiParams.join(","),
                "QUERY_LAYERS": gfiParams.join(","),
                "INFO_FORMAT": "application/json", 
                "FEATURE_COUNT": 10,
                "buffer": 10
            }
        ))).done($.proxy(function(data) {
            if ($.isArray(data.features) && data.features.length > 0) {
                magic.runtime.featureinfo.show(evt.coordinate, data);
            }
        }, this));
    }
};

    