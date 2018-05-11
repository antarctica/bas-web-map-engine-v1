module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            contents: ['src/main/webapp/static/buildjs/*', 'src/main/webapp/static/buildcss/*']
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
                        dest: 'src/main/webapp/static/buildjs/map.js'
                    }
                ]
            },
            mapcss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/map.css'],
                        dest: 'src/main/webapp/static/buildcss/map.css'
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
                            '!src/main/webapp/static/js/creator/forms/Embedded*.js', 
                            '!src/main/webapp/static/js/creator/components/Embedded*.js'
                        ],
                        dest: 'src/main/webapp/static/buildjs/creator.js'
                    }
                ]
            },
            creatorcss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/creator_common.css', 'src/main/webapp/static/css/creator.css'],
                        dest: 'src/main/webapp/static/buildcss/creator.css'
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
                        dest: 'src/main/webapp/static/buildjs/console.js'
                    }
                ]
            },
            consolecss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/console.css'],
                        dest: 'src/main/webapp/static/buildcss/console.css'
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
                        dest: 'src/main/webapp/static/buildjs/embedded_creator.js'
                    }
                ]
            },
            embedded_creatorcss: {
                files: [
                    {
                        src: ['src/main/webapp/static/css/nav.css', 'src/main/webapp/static/css/creator_common.css'],
                        dest: 'src/main/webapp/static/buildcss/embedded_creator.css'
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
                        dest: 'src/main/webapp/static/buildjs/endpoint_manager.js'
                    }
                ]
            }
        },
        uglify: {
            map: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs/map.js',
                        dest: 'src/main/webapp/static/dist/map.min.js'
                    }
                ]
            },
            creator: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs/creator.js',
                        dest: 'src/main/webapp/static/dist/creator.min.js'
                    }
                ]
            },
            console: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs/console.js',
                        dest: 'src/main/webapp/static/dist/console.min.js'
                    }
                ]
            },
            embedded_creator: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs/embedded_creator.js',
                        dest: 'src/main/webapp/static/dist/embedded_creator.min.js'
                    }
                ]
            },
            endpoint_manager: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildjs/endpoint_manager.js',
                        dest: 'src/main/webapp/static/dist/endpoint_manager.min.js'
                    }
                ]
            }
        },
        cssmin: {
            map: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss/map.css',
                        dest: 'src/main/webapp/static/dist/map.min.css'
                    }
                ]
            },
            creator: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss/creator.css',
                        dest: 'src/main/webapp/static/dist/creator.min.css'
                    }
                ]
            },
            console: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss/console.css',
                        dest: 'src/main/webapp/static/dist/console.min.css'
                    }
                ]
            },
            embedded_creator: {
                files: [
                    {        
                        src: 'src/main/webapp/static/buildcss/embedded_creator.css',
                        dest: 'src/main/webapp/static/dist/embedded_creator.min.css'
                    }
                ]
            },
            endpoint_manager: {
                files: [
                    {        
                        src: 'src/main/webapp/static/css/endpoint_manager.css',
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