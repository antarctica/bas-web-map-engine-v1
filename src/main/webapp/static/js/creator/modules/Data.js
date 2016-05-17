/* Map data initialisation for Map Creator */

magic.modules.creator.Data = function () {

    return({
                
        /* Core fields for new blank map */
        BLANK_MAP_CORE: {
            "id": null,
            "name": "new_map",
            "title": "New blank map",
            "description": "Longer description of the purpose of the map goes here",
            "version": "1.0",
            "logo": "",
            "favicon": "bas.ico",
            "repository": null,
            "creation_date": null,
            "modified_date": null,
            "owner_name": "",
            "owner_email": "owner@example.com",
            "metadata_url": "",
            "allowed_usage": "public",
            "allowed_edit": "owner",
            "allowed_download": "public"
        },
        /* Per-region blank map initialisation data */
        BLANK_MAP_DATA: function(name) {           
            return({
                "antarctic": {
                    "projection": "EPSG:3031",
                    "proj_extent": [-5000000,-5000000,5000000,5000000],
                    "center": [0, 0],
                    "zoom": 0,
                    "rotation": 0,
                    "min_zoom": 0,
                    "max_zoom": 13,
                    "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140, 56, 28, 14, 5.6, 2.8, 1.4, 0.56],
                    "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom"],
                    "gazetteers": ["cga"],              
                    "layers": [
                        {
                            "id": null,
                            "name": "Base layers",                        
                            "expanded": true,
                            "base": true,
                            "layers": [
                                {
                                    "id": null,
                                    "name": "Hillshade and bathymetry",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database", "EPSG:3031"),
                                        "feature_name": "add:antarctic_hillshade_and_bathymetry",
                                        "is_base": true
                                    },
                                    "is_visible": true
                                }
                            ]
                        },
                        {
                            "id": null,
                            "name": "Topo layers",
                            "expanded": true,
                            "layers": [
                                {
                                    "id": null,
                                    "name": "Coastline",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database", "EPSG:3031"),
                                        "feature_name": "add:antarctic_coastline"
                                    },     
                                    "is_visible": true
                                },
                                {
                                    "id": null,
                                    "name": "Sub-Antarctic coastline",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database", "EPSG:3031"),
                                        "feature_name": "add:sub_antarctic_coastline"
                                    },     
                                    "is_visible": true
                                }
                            ]
                        },
                        {
                            "id": null,
                            "name": "Grids",
                            "expanded": true,
                            "layers": [
                                {
                                    "id": null,
                                    "name": "Graticule",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database", "EPSG:3031"),
                                        "feature_name": "add:antarctic_graticule",
                                        "is_singletile": true
                                    },   
                                    "is_visible": true                                
                                }
                            ]
                        }
                    ]
                },
                "arctic": {
                    "projection": "EPSG:3995",
                    "proj_extent": [-4000000,-4000000,4000000,4000000],
                    "center": [0, 0],
                    "zoom": 0,
                    "rotation": 0,
                    "min_zoom": 0,
                    "max_zoom": 6,
                    "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140],
                    "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom"],
                    "gazetteers": ["arctic"],
                    "layers": [
                        {
                            "id": null,
                            "name": "Base layers",
                            "expanded": true,
                            "base": true,
                            "layers": [
                                {
                                    "id": null,
                                    "name": "Hillshade and bathymetry",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data", "EPSG:3995"),
                                        "feature_name": "arctic:arctic_hillshade_and_bathymetry",
                                        "is_base": true,
                                        "is_dem": true
                                    },  
                                    "is_visible": true

                                }
                            ]
                        },
                        {
                            "id": null,
                            "name": "Topo layers",
                            "expanded": true,
                            "layers": [
                                {
                                    "id": null,
                                    "name": "Coastline",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data", "EPSG:3995"),
                                        "feature_name": "arctic:arctic_coastline"
                                    },   
                                    "is_visible": true
                                }
                            ]
                        },
                        {
                            "id": null,
                            "name": "Grids",
                            "expanded": true,
                            "layers": [
                                {
                                    "id": null,
                                    "name": "Graticule",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data", "EPSG:3995"),
                                        "feature_name": "arctic:arctic_graticule",
                                        "is_singletile": true
                                    },   
                                    "is_visible": true                                
                                }
                            ]
                        }
                    ]
                },
                "southgeorgia": {
                    "projection": "EPSG:3762",
                    "proj_extent": [-929362.849,-1243855.108,1349814.294,556833.528],
                    "center": [-1000.0, 61900.0],
                    "zoom": 4,
                    "rotation": 0,
                    "min_zoom": 0,
                    "max_zoom": 14,
                    "resolutions": [3360, 1680, 840, 420, 210, 105, 42, 21, 10.5, 4.2, 2.1, 1.12, 0.56, 0.28, 0.14],
                    "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom"],
                    "gazetteers": ["sgssi"],                
                    "layers": [
                        {
                            "id": null,
                            "name": "Base layers",
                            "expanded": true,
                            "base": true,
                            "layers": [
                                {
                                    "id": null,
                                    "name": "Hillshade and bathymetry",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS", "EPSG:3762"),
                                        "feature_name": "sggis:sg_hillshade_and_bathymetry",
                                        "is_base": true,
                                        "is_dem": true
                                    },                                   
                                    "is_visible": true                                
                                }
                            ]
                        },
                        {
                            "id": null,
                            "name": "Topo layers",
                            "expanded": true,
                            "layers": [
                                {
                                    "id": null,
                                    "name": "Coastline",
                                    "source": {
                                        "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS", "EPSG:3762"),
                                        "feature_name": "sggis:sg_coastline"
                                    },   
                                    "is_visible": true
                                }
                            ]
                        }
                    ]
                },
                "midlatitudes": {
                    "projection": "EPSG:3857",  /* Spherical Mercator as per OSM/Google */
                    "proj_extent": [-20026376.39, -20048966.10, 20026376.39, 20048966.10],
                    "center": [0, 0],
                    "zoom": 0,
                    "rotation": 0,
                    "min_zoom": 1,
                    "max_zoom": 20,
                    "resolutions": [],
                    "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom"],
                    "gazetteers": [],                
                    "layers": [
                        {
                            "id": null,
                            "name": "Base layers",
                            "expanded": true,
                            "base": true,
                            "layers": [
                                magic.modules.Endpoints.getMidLatitudeCoastSource()                                
                            ]
                        }
                    ]
                }
            })[name];
        },
        /* Template for a new layer */
        BLANK_MAP_NEW_LAYER: {            
            "id": null,
            "name": "New layer",
            "source": {
                "wms_source": ""
            }
        },
        /* Template for a new group */
        BLANK_MAP_NEW_GROUP: {
            "id": null,
            "name": "New layer group",
            "layers": []
        }
        
    });

}();