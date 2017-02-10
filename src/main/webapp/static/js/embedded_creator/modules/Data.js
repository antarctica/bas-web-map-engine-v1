/* Map data initialisation for embedded Map Creator */

magic.modules.embedded_creator.Data = function () {

    return({
                
        /* Core fields for new blank embedded map */
        BLANK_MAP_CORE: {
            "id": null,
            "name": "new_map",
            "title": "New blank map",
            "description": "Longer description of the purpose of the map goes here",            
            "creation_date": null,
            "modified_date": null,
            "owner_name": "",
            "owner_email": "basmagic@bas.ac.uk",
            "width": 400,
            "height": 300,
            "embed": "map",
            "center": [],
            "zoom": 0,
            "rotation": 0,
            "projection": null,
            "proj_extent": [],
            "resolutions": [],
            "allowed_usage": "public",
            "allowed_edit": "owner"
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
                    "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140, 56, 28, 14, 5.6, 2.8, 1.4, 0.56], 
                    "data": {
                        "layers": [
                            {
                                "id": null,
                                "name": "Hillshade and bathymetry",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                                "feature_name": "add:antarctic_hillshade_and_bathymetry"
                            },
                            {
                                "id": null,
                                "name": "Coastline",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                                "feature_name": "add:antarctic_coastline"
                            },
                            {
                                "id": null,
                                "name": "Sub-Antarctic coastline",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                                "feature_name": "add:sub_antarctic_coastline"
                            },
                            {
                                "id": null,
                                "name": "Graticule",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Antarctic Digital Database"),
                                "feature_name": "add:antarctic_graticule",
                                "is_singletile": true
                            }
                        ]
                    }
                },
                "arctic": {
                    "projection": "EPSG:3995",
                    "proj_extent": [-4000000,-4000000,4000000,4000000],
                    "center": [0, 0],
                    "zoom": 0,
                    "rotation": 0,                    
                    "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140],                    
                    "data": {
                        "layers": [
                            {
                                "id": null,
                                "name": "Hillshade and bathymetry",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                                "feature_name": "arctic:arctic_hillshade_and_bathymetry"
                            },
                            {
                                "id": null,
                                "name": "Coastline",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                                "feature_name": "arctic:arctic_coastline"
                            },
                            {
                                "id": null,
                                "name": "Graticule",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("Arctic Open Data"),
                                "feature_name": "arctic:arctic_graticule",
                                "is_singletile": true
                            }
                        ]
                    }
                },
                "southgeorgia": {
                    "projection": "EPSG:3762",
                    "proj_extent": [-929362.849,-1243855.108,1349814.294,556833.528],
                    "center": [-1000.0, 61900.0],
                    "zoom": 4,
                    "rotation": 0,                    
                    "resolutions": [3360, 1680, 840, 420, 210, 105, 42, 21, 10.5, 4.2, 2.1, 1.12, 0.56, 0.28, 0.14],
                    "data": {
                        "layers": [
                            {
                                "id": null,
                                "name": "Hillshade and bathymetry",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                                "feature_name": "sggis:sg_hillshade_and_bathymetry"
                            },
                            {
                                "id": null,
                                "name": "Coastline",
                                "wms_source": magic.modules.Endpoints.getWmsServiceUrl("South Georgia GIS"),
                                "feature_name": "sggis:sg_coastline"
                            }
                        ]
                    }
                },
                "midlatitudes": {
                    "projection": "EPSG:3857",  /* Spherical Mercator as per OSM/Google */
                    "proj_extent": [-20026376.39, -20048966.10, 20026376.39, 20048966.10],
                    "center": [0, 0],
                    "zoom": 0,
                    "rotation": 0,                   
                    "resolutions": [],
                    "data": {
                        "layers": magic.modules.Endpoints.getMidLatitudeCoastSource()
                    }
                }
            })[name];
        },
        /* Template for a new layer */
        BLANK_MAP_NEW_LAYER: {            
            "id": null,
            "name": "New layer",
            "wms_source": "",
            "feature_name": "",
            "is_singletile": false
        }
        
    });

}();