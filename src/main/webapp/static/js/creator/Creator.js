magic.common.Creator = function() {
    
    return({
        
        /* Core fields for new blank map */
        blank_map_core: {
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
        blank_map_data: {
            "antarctic": {
                "projection": "EPSG:3031",
                "center": [0,0],
                "zoom": 0,
                "min_zoom": 0,
                "max_zoom": 13,
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140, 16, 28, 14, 5.6, 2.8, 1.4, 0.56],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": [],
                "primary_wms": "https://maps.bas.ac.uk/antarctic/wms",
                "primary_wfs": "https://maps.bas.ac.uk/antarctic/wfs",
                "layers": [            
                ]
            },
            "arctic": {
                "projection": "EPSG:3995",
                "center": [0,0],
                "zoom": 0,
                "min_zoom": 0,
                "max_zoom": 6,
                "resolutions": [11200, 5600, 2800, 1400, 560, 280, 140],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": [],
                "primary_wms": "https://maps.bas.ac.uk/arctic/wms",
                "primary_wfs": "https://maps.bas.ac.uk/arctic/wfs",
                "layers": [            
                ]
            },
            "southgeorgia": {
                "projection": "EPSG:3762",
                "center": [-1000.0,61900.0],
                "zoom": 4,
                "min_zoom": 0,
                "max_zoom": 14,
                "resolutions": [3360, 1680, 840, 420, 210, 105, 42, 21, 10.5, 4.2, 2.1, 1.2, 0.56, 0.28, 0.14],
                "controls": ["zoom_world", "zoom_in", "zoom_out", "box_zoom", "full_screen", "overview_map"],
                "gazetteers": [],
                "primary_wms": "https://maps.bas.ac.uk/southgeorgia/wms",
                "primary_wfs": "https://maps.bas.ac.uk/southgeorgia/wfs",
                "layers": [            
                ]
            }
        },
        
        /**
         * Assign all the form element handlers
         */
        init: function() {
            /* Tab 1 */
            /* Creator method radio button change handler */
            $("input[type=radio][name='creator-method']").change(function() {
                $.each(["new", "edit", "clone"], $.proxy(function(idx, elt) {
                    if (elt == this.value) {
                        /* Checked one */
                        $(this).parent().next("select").prop("disabled", false);
                    } else {
                        /* Has been unchecked */
                        $("#creator-method-" + elt).parent().next("select").prop("disabled", true);
                    }
                }, this));
            });            
        },
        
        /**
         * Handler for updating the progress bar
         * @param {object} tab
         * @param {object} navigation
         * @param {int} index
         */
        updateProgressBar: function (tab, navigation, index) {
            var total = navigation.find("li").length;
            var current = index + 1;
            var percent = (current / total) * 100;
            $("#rootwizard").find(".progress-bar").css({width: percent + "%"});
        }
        
    });
    
}();