module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            contents: ['src/main/webapp/static/buildjs_rothera/*', 'src/main/webapp/static/buildcss_rothera/*']
        },
        concat: {
            mapjs: {
                files: [
                    {        
                        src: [
                            'src/main/webapp/static/js/init.js', 
                            'src/main/webapp/static/js/modules/*.js', 
                            'src/main/webapp/static/js/base/*.js', 
                            'src/main/webapp/static/js/components/controlbuttons/*.js',
                            'src/main/webapp/static/js/components/forms/*.js',                             
                            'src/main/webapp/static/js/components/navtools/*.js', 
                            'src/main/webapp/static/js/components/plugins/*.js', 
                            'src/main/webapp/static/js/components/*.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/map.js'
                    }
                ]
            },
            mapjs_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/js/map/*.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/cdn_map_opsgis_rothera.js'
                    }
                ]
            },
            mapcss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/map.css'],
                        dest: 'src/main/webapp/static/buildcss_rothera/map.css'
                    }
                ]
            },
            mapcss_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/css/map/*.css'
                        ],
                        dest: 'src/main/webapp/static/buildcss_rothera/cdn_map_opsgis_rothera.css'
                    }
                ]
            },
            creatorjs: {
                files: [
                    {        
                        src: [
                            'src/main/webapp/static/js/creator/init.js', 
                            'src/main/webapp/static/js/base/PopupForm.js', 
                            'src/main/webapp/static/js/modules/*.js', 
                            'src/main/webapp/static/js/creator/base/DataSourceForm.js', 
                            'src/main/webapp/static/js/components/forms/StylerPopup.js',
                            'src/main/webapp/static/js/creator/forms/*.js',
                            '!src/main/webapp/static/js/creator/forms/Embedded*.js', 
                            'src/main/webapp/static/js/creator/components/*.js',
                            '!src/main/webapp/static/js/creator/components/Embedded*.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/creator.js'
                    }
                ]
            },
            creatorjs_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/js/creator/*.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/cdn_creator_opsgis_rothera.js'
                    }
                ]
            },
            creatorcss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/creator_common.css', 'src/main/webapp/static/css/creator.css'],
                        dest: 'src/main/webapp/static/buildcss_rothera/creator.css'
                    }
                ]
            },
            creatorcss_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/css/creator/*.css'
                        ],
                        dest: 'src/main/webapp/static/buildcss_rothera/cdn_creator_opsgis_rothera.css'
                    }
                ]
            },
            consolejs: {
                files: [
                    {        
                        src: [
                            'src/main/webapp/static/js/init.js', 
                            'src/main/webapp/static/js/modules/Endpoints.js', 
                            'src/main/webapp/static/js/modules/Common.js', 
                            'src/main/webapp/static/js/modules/GeoUtils.js',                             
                            'src/main/webapp/static/js/console/components/WebMapPanel.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/console.js'
                    }
                ]
            },
            consolejs_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/js/console/*.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/cdn_console_opsgis_rothera.js'
                    }
                ]
            },
            consolecss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/console.css'],
                        dest: 'src/main/webapp/static/buildcss_rothera/console.css'
                    }
                ]
            },
            consolecss_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/css/console/*.css'
                        ],
                        dest: 'src/main/webapp/static/buildcss_rothera/cdn_console_opsgis_rothera.css'
                    }
                ]
            },
            embedded_creatorjs: {
                files: [
                    {        
                        src: [
                            'src/main/webapp/static/js/creator/init.js', 
                            'src/main/webapp/static/js/base/PopupForm.js', 
                            'src/main/webapp/static/js/modules/Endpoints.js', 
                            'src/main/webapp/static/js/modules/Common.js', 
                            'src/main/webapp/static/js/modules/GeoUtils.js',                           
                            'src/main/webapp/static/js/creator/forms/Embedded*.js', 
                            'src/main/webapp/static/js/creator/forms/WmsFeatureLinkedMenus.js', 
                            'src/main/webapp/static/js/creator/components/MapRegionSelector.js',
                            'src/main/webapp/static/js/creator/components/MapMetadataForm.js',
                            'src/main/webapp/static/js/creator/components/MapLayerSelector.js',
                            'src/main/webapp/static/js/creator/components/MapParameterSelector.js',
                            'src/main/webapp/static/js/creator/components/EmbeddedAppContainer.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/embedded_creator.js'
                    }
                ]
            },
            embedded_creatorjs_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/js/embedded_creator/*.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/cdn_embedded_creator_opsgis_rothera.js'
                    }
                ]
            },
            embedded_creatorcss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/creator_common.css'],
                        dest: 'src/main/webapp/static/buildcss_rothera/embedded_creator.css'
                    }
                ]
            },
            embedded_creatorcss_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/css/embedded_creator/*.css'
                        ],
                        dest: 'src/main/webapp/static/buildcss_rothera/cdn_embedded_creator_opsgis_rothera.css'
                    }
                ]
            },
            endpoint_managerjs: {
                files: [
                    {        
                        src: [
                            'src/main/webapp/static/js/endpoint_manager/init.js',                            
                            'src/main/webapp/static/js/modules/Common.js', 
                            'src/main/webapp/static/js/base/CustomFormInput.js',                           
                            'src/main/webapp/static/js/components/forms/TagsInput.js',
                            'src/main/webapp/static/js/components/forms/MultiSelectInput.js',
                            'src/main/webapp/static/js/endpoint_manager/components/EndpointManagerPanel.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/endpoint_manager.js'
                    }
                ]
            },
            endpoint_managerjs_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/js/endpoint_manager/*.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs_rothera/cdn_endpoint_manager_opsgis_rothera.js'
                    }
                ]
            },
            endpoint_managercss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/endpoint_manager.css'],
                        dest: 'src/main/webapp/static/buildcss_rothera/endpoint_manager.css'
                    }
                ]
            },
            endpoint_managercss_cdn: {
                files: [
                    {        
                        src: [
                            'provisioning/rothera/css/endpoint_manager/*.css'
                        ],
                        dest: 'src/main/webapp/static/buildcss_rothera/cdn_endpoint_manager_opsgis_rothera.css'
                    }
                ]
            }
        },
        uglify: {
            map: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/map.js',
                        dest: 'src/main/webapp/static/dist/map.min.js'
                    }
                ]
            },
            map_cdn: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/cdn_map_opsgis_rothera.js',
                        dest: 'src/main/webapp/static/dist/cdn_map_opsgis_rothera.min.js'
                    }
                ]
            },
            creator: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/creator.js',
                        dest: 'src/main/webapp/static/dist/creator.min.js'
                    }
                ]
            },
            creator_cdn: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/cdn_creator_opsgis_rothera.js',
                        dest: 'src/main/webapp/static/dist/cdn_creator_opsgis_rothera.min.js'
                    }
                ]
            },
            console: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/console.js',
                        dest: 'src/main/webapp/static/dist/console.min.js'
                    }
                ]
            },
            console_cdn: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/cdn_console_opsgis_rothera.js',
                        dest: 'src/main/webapp/static/dist/cdn_console_opsgis_rothera.min.js'
                    }
                ]
            },
            embedded_creator: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/embedded_creator.js',
                        dest: 'src/main/webapp/static/dist/embedded_creator.min.js'
                    }
                ]
            },
            embedded_creator_cdn: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/cdn_embedded_creator_opsgis_rothera.js',
                        dest: 'src/main/webapp/static/dist/cdn_embedded_creator_opsgis_rothera.min.js'
                    }
                ]
            },
            endpoint_manager: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/endpoint_manager.js',
                        dest: 'src/main/webapp/static/dist/endpoint_manager.min.js'
                    }
                ]
            },
            endpoint_manager_cdn: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs_rothera/cdn_endpoint_manager_opsgis_rothera.js',
                        dest: 'src/main/webapp/static/dist/cdn_embedded_endpoint_manager_opsgis_rothera.min.js'
                    }
                ]
            }
        },
        cssmin: {
            map: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss_rothera/map.css',
                        dest: 'src/main/webapp/static/dist/map.min.css'
                    }
                ]
            },
            creator: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss_rothera/creator.css',
                        dest: 'src/main/webapp/static/dist/creator.min.css'
                    }
                ]
            },
            console: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss_rothera/console.css',
                        dest: 'src/main/webapp/static/dist/console.min.css'
                    }
                ]
            },
            embedded_creator: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss_rothera/embedded_creator.css',
                        dest: 'src/main/webapp/static/dist/embedded_creator.min.css'
                    }
                ]
            },
            endpoint_manager: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss_rothera/endpoint_manager.css',
                        dest: 'src/main/webapp/static/dist/endpoint_manager.min.css'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-css');
    grunt.registerTask('default', ['clean', 'concat', 'uglify', 'cssmin', 'clean']);
};