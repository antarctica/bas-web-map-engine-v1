/* Map Creator tab4 logic */

magic.modules.creator.Tab4 = function () {

    return({
        
        map: null,
                
        init: function() {           
        },
        loadContext: function(context) {                                    
        },
        saveContext: function(context) {
            context.data.center = this.map.getView().getCenter();
            var rotation = $("#t4-rotation").val();
            context.data.rotation = !$.isNumeric(rotation) ? 0.0 : rotation;
            context.data.zoom = this.map.getView().getZoom();
        },
        loadMap: function(context) {
            var resetMap = false;
            if (this.map) {
                /* See if projection has changed => must recreate map */
                var newProj = context.data.projection;
                var oldProj = this.map.getView().getProjection().getCode();
                resetMap = (newProj != oldProj);
            }            
            if (resetMap || !this.map) {
                this.map = null;
                $("#t4-map").children().remove();
                var proj = ol.proj.get(context.data.projection);
                proj.setExtent(context.data.proj_extent);
                proj.setWorldExtent(context.data.proj_extent);

                var view = new ol.View({
                    center: context.data.center,
                    maxResolution: context.data.resolutions[0],
                    resolutions: context.data.resolutions,
                    rotation: context.data.rotation,
                    zoom: context.data.zoom,
                    projection: proj
                });
                
                var wms = magic.modules.Common.wms_endpoints[context.data.projection][0]["wms"];
                var coasts = magic.modules.Common.wms_endpoints[context.data.projection][0]["coast"];
                var layers = [];
                $.each(coasts, function(idx, cl) {
                    var wmsSource = new ol.source.TileWMS({
                        url: wms,
                        params: {
                            "LAYERS": cl, 
                            "CRS": proj.getCode(),
                            "SRS": proj.getCode(),
                            "VERSION": "1.3.0",
                            "TILED": true
                        },
                        tileGrid: new ol.tilegrid.TileGrid({
                            resolutions: context.data.resolutions,
                            origin: proj.getExtent().slice(0, 2)
                        }),
                        projection: proj
                    });
                    layers.push(new ol.layer.Tile({
                        visible: true,
                        opacity: 1.0,
                        source: wmsSource
                    }));
                });                

                this.map = new ol.Map({
                    renderer: "canvas",
                    loadTilesWhileAnimating: true,
                    loadTilesWhileInteracting: true,
                    layers: layers,
                    controls: [
                        new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
                        new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
                        new ol.control.MousePosition({
                            projection: "EPSG:4326",
                            className: "custom-mouse-position",
                            coordinateFormat: function (xy) {
                                return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
                            }
                        })
                    ],
                    interactions: ol.interaction.defaults(),
                    target: "t4-map",
                    view: view
                });
            }
        },
        validate: function() {
            return(true);
        }

    });

}();