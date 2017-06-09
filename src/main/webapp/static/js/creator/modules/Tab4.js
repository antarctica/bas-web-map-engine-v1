/* Map Creator tab4 logic */

magic.modules.creator.Tab4 = function () {

    return({
        
        map: null,
                
        init: function() {
            jQuery("#t4-rotation-set").click(jQuery.proxy(function(evt) {
                var rotationDeg = jQuery("#t4-rotation").val();
                if (!isNaN(rotationDeg)) {
                    var rotationRad = Math.PI*rotationDeg/180.0;
                    this.map.getView().setRotation(rotationRad);
                }
            }, this));
        },
        loadContext: function(context) {                                    
        },
        saveContext: function(context) {
            context.data.center = this.map.getView().getCenter();
            var rotation = parseFloat(jQuery("#t4-rotation").val());
            context.data.rotation = isNaN(rotation) ? 0.0 : rotation;
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
                jQuery("#t4-map").children().remove();
                var proj = ol.proj.get(context.data.projection);                               
                var view = null;
                /* Sort out the rotation (saved in degrees - OL needs radians */
                var rotation = parseFloat(context.data.rotation);
                if (isNaN(rotation)) {
                    rotation = 0.0;
                } else {
                    rotation = Math.PI*rotation/180.0;
                }
                jQuery("#t4-rotation").val(context.data.rotation);
                var layers = [];
                var projEp;
                var projEps = magic.modules.Endpoints.getEndpointsBy("srs", context.data.projection);
                for (var i = 0; i < projEps.length; i++) {
                    if (projEps[i].coast_layers) {
                        projEp = projEps[i];
                        break;
                    }
                }
                if (!projEp) {
                    bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No endpoint service defined for projection ' + context.data.projection + '</div>');
                    return;
                }
                if (projEp.url == "osm") {
                    /* OpenStreetMap is used for mid-latitude maps */
                    layers.push(magic.modules.Endpoints.getMidLatitudeCoastLayer());
                    view = new ol.View({                        
                        center: context.data.center,
                        minZoom: 1,
                        maxZoom: 20,
                        rotation: rotation,
                        zoom: context.data.zoom,
                        projection: proj
                    });
                } else {
                    /* Other WMS */
                    proj.setExtent(context.data.proj_extent);   /* Don't do this for OSM - bizarre ~15km shifts happen! */
                    proj.setWorldExtent(context.data.proj_extent);
                    var coasts = projEp.coast_layers.split(",");                    
                    jQuery.each(coasts, function(idx, cl) {
                        var wmsSource = new ol.source.TileWMS({
                            url: magic.modules.Endpoints.getOgcEndpoint(projEp.url, "wms"),
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
                    var controls = [
                        new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
                        new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
                        new ol.control.MousePosition({
                            projection: "EPSG:4326",
                            className: "custom-mouse-position",
                            coordinateFormat: function (xy) {
                                return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
                            }
                        })
                    ];
                    var olGrat = null;
                    var graticule = projEp.graticule_layer;
                    if (graticule) {
                        if (graticule == "ol") {
                            /* Use the native OL graticule control - commented out 2017-06-09 as OL doesn't support labelling yet - a fundamental requirement */
//                            olGrat = new ol.Graticule({
//                                projection: proj,
//                                maxLines: 10
//                            });
                        } else {
                            /* Use prepared data for Polar Stereographic as OL control does not work */
                            var wmsSource = new ol.source.ImageWMS(({
                                url: magic.modules.Endpoints.getOgcEndpoint(projEp.url, "wms"),
                                params: {"LAYERS": graticule},
                                projection: proj
                            }));
                            layers.push(new ol.layer.Image({
                                visible: true,
                                opacity: 1.0,
                                source: wmsSource
                            }));
                        }
                    }
                    view = new ol.View({
                        center: context.data.center,
                        maxResolution: context.data.resolutions[0],
                        resolutions: context.data.resolutions,
                        rotation: rotation,
                        zoom: context.data.zoom,
                        projection: proj
                    });
                }

                this.map = new ol.Map({
                    renderer: "canvas",
                    loadTilesWhileAnimating: true,
                    loadTilesWhileInteracting: true,
                    layers: layers,
                    controls: controls,
                    interactions: ol.interaction.defaults(),
                    target: "t4-map",
                    view: view
                });
                if (olGrat != null) {
                    olGrat.setMap(this.map);
                }
            }
        },
        validate: function() {
            return(true);
        }

    });

}();