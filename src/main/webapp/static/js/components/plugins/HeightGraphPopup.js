/* Height graph plotting along a linestring, displayed in a popover */

magic.classes.HeightGraphPopup = function(options) {           
    
    magic.classes.DemAwareTool.call(this, options);
    
    /* Id of target element for the popover */
    this.target = options.target ? jQuery("#" + options.target) : null;
    
    /* How many sample points to use along line segments */
    this.interpolation = 5;
    
};

magic.classes.HeightGraphPopup.prototype = Object.create(magic.classes.DemAwareTool.prototype);
magic.classes.HeightGraphPopup.prototype.constructor = magic.classes.HeightGraphPopup;

/**
 * Display a 3D height graph along the given route in a popover
 * @param {ol.geom.Linestring} route
 */
magic.classes.HeightGraphPopup.prototype.activate = function(route) {
    var demFeats = this.currentlyVisibleDems();
    if (demFeats.length > 0) {
        var gfiRequests = [], outputCoords = [];
        var routePoints = route.getCoordinates();
        for (var i = 0; i < routePoints.length; i++) {
            /* Get the line segment endpoints */
            var c0 = routePoints[i];
            var c1 = i == routePoints.length - 1 ? null : routePoints[i+1];
            var nInterp = i == routePoints.length - 1 ? 1 : this.interpolation;            
            /* Interpolate along the line segment */
            for (var j = 0; j < nInterp; j++) {
                var cj = nInterp == 1 ? c0 : [c0[0] + j*(c1[0] - c0[0])/nInterp, c0[1] + j*(c1[1] - c0[1])/nInterp];
                /* Transform the co-ordinate to WGS84 for output, and add the z dimension */
                var llCoord = ol.proj.transform(cj, this.map.getView().getProjection(), "EPSG:4326");
                llCoord.push(0.0);  
                outputCoords.push(llCoord);
                /* Create the WMS GetFeatureInfo request for this point */
                var gfiXhr = jQuery.get(this.getGfiUrl(cj), 
                {
                    "LAYERS": demFeats.join(","),
                    "QUERY_LAYERS": demFeats.join(","),
                    "INFO_FORMAT": "application/json",
                    "FEATURE_COUNT": this.demLayers.length
                }, jQuery.proxy(function(data, status, xhr) {                   
                    var elevation = parseFloat(this.getDemValue(data));
                    console.log(elevation);
                    outputCoords[xhr.offset][2] = isNaN(elevation) ? 0.0 : elevation;
                }, this));
                gfiXhr.offset = outputCoords.length - 1;
                gfiRequests.push(gfiXhr);                                
            }                                    
        }
        /* Start the elevation request chain */
        var defer = jQuery.when.apply(jQuery, gfiRequests);
        defer.always(jQuery.proxy(function() {
            console.log(outputCoords);
            var origTitle = this.target.attr("title");
            this.target.attr("title", "Height graph").popover({
                template: 
                    '<div class="popover popover-auto-width" role="popover">' +
                        '<div class="arrow"></div>' +
                        '<h3 class="popover-title"></h3>' +
                        '<div id="' + this.id + '-height-graph-vis" class="popover-content"></div>' +
                    '</div>',
                title: "Height graph",
                container: "body",
                html: true,
                trigger: "manual",
                content: "Loading height graph..."
            })
            .on("shown.bs.popover", null, {"coords": outputCoords}, jQuery.proxy(function(evt) {            
                var xyzData = evt.data.coords;
                var vds = new vis.DataSet();
                for (var i = 0; i < xyzData.length; i++) {
                    vds.add({
                        id: i,
                        x: xyzData[i][0],   /* Lon */
                        y: xyzData[i][1],   /* Lat */
                        z: xyzData[i][2],   /* Altitude */
                        style: 50
                    });
                }
                var options = {
                    width: "100%",
                    height: "400px",
                    style: "bar-size",
                    showPerspective: true,
                    showGrid: true,
                    showShadow: false,
                    keepAspectRatio: true,
                    verticalRatio: 0.2,
                    xBarWidth: 0.004,
                    yBarWidth: 0.004,
                    xLabel: "Lon",
                    yLabel: "Lat",
                    zLabel: "Altitude"
                };
                var container = jQuery("#" + this.id + "-height-graph-vis");
                var graph3d = new vis.Graph3d(container[0], vds, options);
            }, this))
            .on("hidden.bs.popover", jQuery.proxy(function(evt) {            
                this.target.attr("title", origTitle);
            }, this));
            this.target.popover("show");
        }, this))
        .fail(jQuery.proxy(function(xhr) {
            console.log(xhr);
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Failed to generate data for height graph - details below:</p>' + 
                    '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                '</div>'
            );
        }, this));        
    }
};

magic.classes.HeightGraphPopup.prototype.deactivate = function() {
    if (this.target) {
        this.target.popover("hide");
    }
};

magic.classes.HeightGraphPopup.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.HeightGraphPopup.prototype.setTarget = function(targetId) {
    this.target = jQuery("#" + targetId);
};


magic.classes.HeightGraphPopup.prototype.getInterpolation = function() {
    return(this.interpolation);
};

magic.classes.HeightGraphPopup.prototype.setInterpolation = function(interpolation) {
    this.interpolation = interpolation;
};

