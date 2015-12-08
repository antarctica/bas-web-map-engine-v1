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
            
            var wmsSource = new ol.source.TileWMS({
                url: "https://maps.bas.ac.uk/antarctic/wms",
                params: {
                    "LAYERS": "add:antarctic_coastline", 
                    "CRS": proj.getCode(),
                    "SRS": proj.getCode(),
                    "VERSION": "1.3.0",
                    "TILED": true, 
                    "WORKSPACE": "add"
                },
                tileGrid: new ol.tilegrid.TileGrid({
                    resolutions: context.data.resolutions,
                    origin: proj.getExtent().slice(0, 2)
                }),
                projection: proj
            });                     
            
            this.map = new ol.Map({
                renderer: "canvas",
                loadTilesWhileAnimating: true,
                loadTilesWhileInteracting: true,
                layers: [new ol.layer.Tile({
                    name: "t4-map-coast-layer",
                    visible: true,
                    opacity: 1.0,
                    source: wmsSource
                })],
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

    });

}();