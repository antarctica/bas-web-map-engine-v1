/* Map Creator tab1 logic */

magic.modules.embedded_creator.Tab1 = function () {

    return({
        
        map_context: null,
        
        map: null,
        
        /* List of user layers */
        layerdata = {};
        
        prefix: "em-map",
               
        form_fields: [
            {"field": "id", "default": ""},
            {"field": "name","default": "new_map"},
            {"field": "title", "default": "New blank map"},
            {"field": "description", "default": "Longer description of the purpose of the map goes here"},            
            {"field": "owner_email", "default": "basmagic@bas.ac.uk"},
            {"field": "width", "default": 400},
            {"field": "height", "default": 300},
            {"field": "embed", "default": "map"},
            {"field": "rotation", "default": 0}
        ],
                
        init: function () {
            this.map_context = new magic.classes.creator.MapContext();
            /* Creator method radio button change handler */
            jQuery("input[name$='action-rb']").click(jQuery.proxy(function (evt) {
                var rb = jQuery(evt.currentTarget);
                jQuery.each(["new", "edit", "clone"], jQuery.proxy(function (idx, action) {
                    if (action == rb.val()) {
                        /* Checked one */
                        var select = jQuery("#" + this.prefix + "-" + action);
                        select.prop("disabled", false);                        
                        var mapName = "";
                        if (action == "edit") {
                            var search = window.location.search;
                            if (search && search.match(/\?name=[a-z0-9_]+$/)) {
                                /* Named map */
                                mapName = search.substring(6);
                            }
                        } 
                        if (action == "edit" || action == "clone") {
                            /* Service returns [{name: <name>, title: <title>},...] */
                            select.find("option").remove();
                            jQuery.getJSON(magic.config.paths.baseurl + "/embedded_maps/dropdown/" + action, jQuery.proxy(function (data) {
                                magic.modules.Common.populateSelect(select, data, "name", "title", mapName, true); 
                                magic.modules.creator.Common.resetFormIndicators();
                                if (action == "edit") {
                                    this.map_context.load("edit", mapName, true, jQuery.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));
                                }
                            }, this));
                        }                  
                    } else {
                        /* Has been unchecked */
                        jQuery("#" + this.prefix + "-" + action).prop("disabled", true);
                    }
                }, this));
            }, this));
            /* Load a map definition depending on the selection */
            jQuery("select.map-select").change(jQuery.proxy(function (evt) {
                var sel = jQuery(evt.currentTarget);
                var action = sel.attr("id").split("-").pop();
                var mapName = sel.val();
                magic.modules.creator.Common.resetFormIndicators();
                jQuery("div.hidden").removeClass("hidden");
                this.map_context.load(action, mapName, true, jQuery.proxy(this.loadContext, this));                
            }, this)); 
            /* If there is a search string, assume a map edit */
            var search = window.location.search;
            if (search && search.match(/\?name=[a-z0-9_]+$/)) {
                jQuery("#" + this.prefix + "-edit-rb").trigger("click");                
            }
            /* Set rotation button should rotate the map */
            jQuery("#" + this.prefix + "-rotation-set").click(jQuery.proxy(function(evt) {
                var rotationDeg = jQuery("#" + this.prefix + "-rotation").val();
                if (!isNaN(rotationDeg) && this.map) {
                    var rotationRad = Math.PI*rotationDeg/180.0;
                    this.map.getView().setRotation(rotationRad);
                }
            }, this));
        },
        validate: function() {
            /* Make sure a map source selection has been made */
            var checkRb = jQuery("input[type='radio'][name='_" + this.prefix + "-action-rb']:checked");
            if (!checkRb) {
                return(false);
            }
            if (jQuery("#" + this.prefix + "-" + checkRb.val()) == "") {
                return(false);
            }
            /* Check form inputs */
            var form = jQuery("#" + this.prefix + "-form");
            var ok = form[0].checkValidity();
            /* Indicate invalid fields */
            jQuery.each(form.find("input[required='required'],textarea[required='required'],input[type='url']"), function(idx, ri) {
                var riEl = jQuery(ri);
                var fg = riEl.closest("div.form-group");
                var vState = riEl.prop("validity");
                if (vState.valid) {
                    fg.removeClass("has-error").addClass("has-success");
                } else {
                    fg.removeClass("has-success").addClass("has-error");
                }
            });
            return(ok);
        },
        /**
         * Populate tab form from data
         */
        loadContext: function (context) {        
            magic.modules.creator.Common.dictToForm(this.form_fields, context, this.prefix);
            this.loadMap(context);
            this.loadLayers(context);
        },
        /**
         * Populate data from tab form
         */
        saveContext: function (context) {
            magic.modules.creator.Common.formToDict(this.form_fields, context, this.prefix);
            /* Read center, zoom and projection details from the map */
            var mapView = this.map.getView();
            context.center = mapView.getCenter();
            context.zoom = mapView.getZoom();
            context.projection = mapView.getProjection().getCode();
            context.proj_extent = mapView.getProjection().getExtent();
            context.resolutions = mapView.getResolutions();
            /* Read the data layers */
            
        },
        /**
         * Load up selector map
         * @param {object} context
         */
        loadMap: function (context) {
            var resetMap = false;
            if (this.map) {
                /* See if projection has changed => must recreate map */
                var newProj = context.projection;
                var oldProj = this.map.getView().getProjection().getCode();
                resetMap = (newProj != oldProj);
            }            
            if (resetMap || !this.map) {
                this.map = null;
                jQuery("#" + this.prefix + "-selector-map").children().remove();
                var proj = ol.proj.get(context.projection);                               
                var view = null;
                /* Sort out the rotation (saved in degrees - OL needs radians */
                var rotation = parseFloat(context.rotation);
                if (isNaN(rotation)) {
                    rotation = 0.0;
                } else {
                    rotation = Math.PI*rotation/180.0;
                }
                jQuery("#" + this.prefix + "-rotation").val(context.rotation);
                var layers = [];
                var projEp = magic.modules.Endpoints.getEndpointBy("srs", context.projection);
                if (!projEp) {
                    bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">No endpoint service defined for projection ' + context.projection + '</div>');
                    return;
                }
                if (projEp.url == "osm") {
                    /* OpenStreetMap is used for mid-latitude maps */
                    layers.push(magic.modules.Endpoints.getMidLatitudeCoastLayer());
                    view = new ol.View({                        
                        center: context.center,
                        minZoom: 1,
                        maxZoom: 20,
                        rotation: rotation,
                        zoom: context.zoom,
                        projection: proj
                    });
                } else {
                    /* Other WMS */
                    proj.setExtent(context.proj_extent);   /* Don't do this for OSM - bizarre ~15km shifts happen! */
                    proj.setWorldExtent(context.proj_extent);
                    var coasts = projEp.coast_layers.split(",");                    
                    jQuery.each(coasts, function(idx, cl) {
                        var wmsSource = new ol.source.TileWMS({
                            url: projEp.url,
                            params: {
                                "LAYERS": cl, 
                                "CRS": proj.getCode(),
                                "SRS": proj.getCode(),
                                "VERSION": "1.3.0",
                                "TILED": true
                            },
                            tileGrid: new ol.tilegrid.TileGrid({
                                resolutions: context.resolutions,
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
                        new ol.control.ZoomSlider(),
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
                        /* Use prepared data for Polar Stereographic as OL control does not work */
                        var wmsSource = new ol.source.ImageWMS(({
                            url: projEp.url,
                            params: {"LAYERS": graticule},
                            projection: proj
                        }));
                        layers.push(new ol.layer.Image({
                            visible: true,
                            opacity: 1.0,
                            source: wmsSource
                        }));
                    }
                    view = new ol.View({
                        center: context.center,
                        maxResolution: context.resolutions[0],
                        resolutions: context.resolutions,
                        rotation: rotation,
                        zoom: context.zoom,
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
                    target: this.prefix + "-selector-map",
                    view: view
                });
                if (olGrat != null) {
                    olGrat.setMap(this.map);
                }
            }
        },
        loadLayers: function (context) {
            if (context.data && jQuery.isArray(context.data.layers)) {
                var layers = context.data.layers;
                var table = jQuery("#" + this.prefix + "-layerlist");
                var rows = table.find("tr");
                if (rows.length > 0) {
                    rows.remove();
                }
                if (layers.length > 0) {                    
                    table.removeClass("hidden");
                    var tbody = table.find("tbody");
                    for (var i = 0; i < layers.length; i++) {
                        var service = magic.modules.Endpoints.getEndpointBy("url", layers[i].wms_source);
                        var serviceName = layers[i].wms_source;
                        if (service) {
                            serviceName = service.name;
                        }
                        tbody.append(
                            '<tr id="' + this.prefix + '-row-' + layers[i].id + '>' + 
                                '<td>' + serviceName + '</td>' + 
                                '<td>' + layers[i].name + '</td>' + 
                                '<td align="right">' + layers[i].opacity + '</td>' + 
                                '<td align="right">' + layers[i].is_singletile + '</td>' + 
                                '<td>' + 
                                    '<span style="display:block; margin-bottom: 5px">' + 
                                        '<a href="Javascript:void(0)" title="Edit layer data" target="_blank">' + 
                                            '<i style="font-size: 20px; color: #286090; margin-right: 5px" class="fa fa-pencil"></i>' + 
                                        '</a>' + 
                                        '<a href="Javascript:void(0)" title="Remove layer from map">' +
                                            '<i style="font-size: 20px; color: #d9534f" class="fa fa-trash"></i>' + 
                                        '</a>' + 
                                    '</span>' + 
                                '</td>' + 
                            '</tr>'
                        );
                    }
                } else {
                    table.addClass("hidden");
                }
            }
        }                

    });

}();