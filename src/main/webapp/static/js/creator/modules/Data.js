/* Map data initialisation for Map Creator */

magic.modules.creator.Data = function () {

    return({
                
        /* Core fields for new blank map */
        BLANK_MAP_CORE: {
            "id": "",
            "name": "New blank map",
            "description": "Longer description of the purpose of the map goes here",
            "version": "1.0",
            "logo": "bas.png",
            "favicon": "bas.ico",
            "repository": null,
            "creation_date": null,
            "modified_date": null,
            "owner_name": null,
            "owner_email": "owner@example.com",
            "metadata_url": null
        },
        /* Per-region blank map initialisation data */
        BLANK_MAP_DATA: {
            "antarctic": {
                "projection": "EPSG:3031",
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,
                "min_zoom": 0,
                "max_zoom": 13,
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140, 16, 28, 14, 5.6, 2.8, 1.4, 0.56],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": ["cga"],              
                "layers": [
                    {
                        "id": "",
                        "name": "Base layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Hillshade and bathymetry",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/antarctic/wms",
                                    "feature_name": "add:antarctic_hillshade_and_bathymetry",
                                    "is_base": true,                                    
                                    "is_dem": true
                                },
                                "is_visible": true
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Coastline",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/antarctic/wms",
                                    "feature_name": "add:antarctic_coastline"
                                },     
                                "is_visible": true
                            },
                            {
                                "id": "",
                                "name": "Sub-Antarctic coastline",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/antarctic/wms",
                                    "feature_name": "add:sub_antarctic_coastline"
                                },     
                                "is_visible": true
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Grids",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Graticule",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/antarctic/wms",
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
                "center": [0, 0],
                "zoom": 0,
                "rotation": 0,
                "min_zoom": 0,
                "max_zoom": 6,
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": ["arctic"],
                "layers": [
                    {
                        "id": "",
                        "name": "Base layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Hillshade and bathymetry",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/arctic/wms",
                                    "feature_name": "arctic:arctic_hillshade_and_bathymetry",
                                    "is_base": true,
                                    "is_dem": true
                                },  
                                "is_visible": true
                                
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Coastline",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/arctic/wms",
                                    "feature_name": "arctic:arctic_coastline"
                                },   
                                "is_visible": true
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Grids",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Graticule",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/arctic/wms",
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
                "center": [-1000.0, 61900.0],
                "zoom": 4,
                "rotation": 0,
                "min_zoom": 0,
                "max_zoom": 14,
                "resolutions": [3360, 1680, 840, 420, 210, 105, 42, 21, 10.5, 4.2, 2.1, 1.2, 0.56, 0.28, 0.14],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": ["sg"],                
                "layers": [
                    {
                        "id": "",
                        "name": "Base layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Hillshade and bathymetry",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/southgeorgia/wms",
                                    "feature_name": "sggis:sg_hillshade_and_bathymetry",
                                    "is_base": true,
                                    "is_dem": true
                                },                                   
                                "is_visible": true                                
                            }
                        ]
                    },
                    {
                        "id": "",
                        "name": "Topo layers",
                        "expanded": true,
                        "layers": [
                            {
                                "id": "",
                                "name": "Coastline",
                                "source": {
                                    "wms_source": "https://maps.bas.ac.uk/southgeorgia/wms",
                                    "feature_name": "sggis:sg_coastline"
                                },   
                                "is_visible": true
                            }
                        ]
                    }
                ]
            }
        },
        /* Template for a new layer */
        BLANK_MAP_NEW_LAYER: {            
            "id": "",
            "name": "New layer",
            "source": {
                "wms_source": "http://localhost:8080/geoserver/wms"
            }
        },
        /* Template for a new group */
        BLANK_MAP_NEW_GROUP: {
            "id": "",
            "name": "New layer group",
            "layers": [                
            ]
        },
        /* Possible WMS endpoints for each projection */
        WMS_ENDPOINTS: {
            "EPSG:3031": [
                {
                    "name": "Antarctic Digital Database",
                    "value": "https://maps.bas.ac.uk/antarctic/wms"
                },
                {
                    "name": "Operations GIS",
                    "value": "http:/rolgis.nerc-bas.ac.uk:8080/geoserver/wms"
                },
                {
                    "name": "CCAMLR GIS",
                    "value": "https://gis.ccamlr.org/geoserver/wms"
                },
                {
                    "name": "Antarctic Peninsula Information Portal",
                    "value": "http://bslbatgis.nerc-bas.ac.uk:8080/geoserver/wms"
                },
                {
                    "name": "Polar View",
                    "value": "http://geos.polarview.aq/geoserver/wms"
                }
            ],
            "EPSG:3995": [
                {
                    "name": "NERC Arctic Office Map",
                    "value": "https://maps.bas.ac.uk/arctic/wms"
                }
            ],
            "EPSG:3762": [
                {
                    "name": "South Georgia GIS",
                    "value": "https://maps.bas.ac.uk/southgeorgia/wms"
                }
            ]
        },
        /* Default local Geoserver endpoint */
        DEFAULT_GEOSERVER_WMS: {
            "name": "Local Geoserver WMS",
            "value": "http://localhost:8080/geoserver/wms"
        }

    });

}();