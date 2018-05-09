module.exports = function (grunt) {
    grunt.initConfig({
        clean: {
            contents: ['src/main/webapp/static/buildjs/*', 'src/main/webapp/static/buildcss/*']
        },
        concat: {
            mapjs: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: [
                            'init.js', 
                            'modules/*.js', 
                            'base/*.js', 
                            'components/forms/*.js', 
                            'components/navtools/*.js', 
                            'components/plugins/*.js', 
                            'components/*.js'
                        ],
                        dest: 'buildjs/map.js'
                    }
                ]
            },
            mapcss: {
                files: {
                    cwd: 'src/main/webapp/static/css',
                    src: ['nav.css', 'map.css'],
                    dest: 'buildcss/map.css'
                }
            },
            creatorjs: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: [
                            'creator/init.js', 
                            'base/PopupForm.js', 
                            'modules/*.js', 
                            'creator/base/DataSourceForm.js', 
                            'components/forms/StylerPopup.js', 
                            '!creator/forms/Embedded*.js', 
                            '!creator/components/Embedded*.js'
                        ],
                        dest: 'buildjs/creator.js'
                    }
                ]
            },
            creatorcss: {
                files: {
                    cwd: 'src/main/webapp/static/css',
                    src: ['nav.css', 'creator_common.css', 'creator.css'],
                    dest: 'buildcss/creator.css'
                }
            },
            consolejs: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: [
                            'init.js', 
                            'modules/Endpoints.js', 
                            'modules/Common.js', 
                            'modules/GeoUtils.js',                             
                            'components/WebMapPanel.js'
                        ],
                        dest: 'buildjs/console.js'
                    }
                ]
            },            
            embedded_creatorjs: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: [
                            'creator/init.js', 
                            'base/PopupForm.js', 
                            'modules/Endpoints.js', 
                            'modules/Common.js', 
                            'modules/GeoUtils.js',                           
                            'creator/forms/Embedded*.js', 
                            'creator/forms/WmsFeatureLinkedMenus.js', 
                            'creator/components/MapRegionSelector.js',
                            'creator/components/MapMetadataForm.js'
                            'creator/components/MapLayerSelector.js'
                            'creator/components/MapParameterSelector.js',
                            'creator/components/EmbeddedAppContainer.js'
                        ],
                        dest: 'buildjs/embedded_creator.js'
                    }
                ]
            },
            embedded_creatorcss: {
                files: {
                    cwd: 'src/main/webapp/static/css',
                    src: ['nav.css', 'creator_common.css'],
                    dest: 'buildcss/embedded_creator.css'
                }
            },
            endpoint_managerjs: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: [
                            'endpoint_manager/init.js',                            
                            'modules/Common.js', 
                            'base/CustomFormInput.js',                           
                            'components/forms/TagsInput.js',
                            'components/forms/MultiSelectInput.js',
                            'endpoint_manager/components/EndpointManagerPanel.js'
                        ],
                        dest: 'buildjs/endpoint_manager.js'
                    }
                ]
            }
        },
        uglify: {
            map: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: 'buildjs/map.js,'
                        dest: 'dest/map.min.js'
                    }
                ]
            },
            creator: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: 'buildjs/creator.js,'
                        dest: 'dest/creator.min.js'
                    }
                ]
            },
            console: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: 'buildjs/console.js,'
                        dest: 'dest/console.min.js'
                    }
                ]
            },
            embedded_creator: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: 'buildjs/embedded_creator.js,'
                        dest: 'dest/embedded_creator.min.js'
                    }
                ]
            },
            endpoint_manager: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static/js',
                        src: 'buildjs/endpoint_manager.js,'
                        dest: 'dest/endpoint_manager.min.js'
                    }
                ]
            }
        },
        cssmin: {
            map: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static',
                        src: 'buildcss/map.css,'
                        dest: 'dest/map.min.css'
                    }
                ]
            },
            creator: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static',
                        src: 'buildcss/creator.css,'
                        dest: 'dest/creator.min.css'
                    }
                ]
            },
            console: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static',
                        src: 'css/console.css,'
                        dest: 'dest/creator.min.css'
                    }
                ]
            },
            embedded_creator: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static',
                        src: 'buildcss/embedded_creator.css,'
                        dest: 'dest/embedded_creator.min.css'
                    }
                ]
            },
            endpoint_manager: {
                files: [
                    {        
                        cwd: 'src/main/webapp/static',
                        src: 'css/endpoint_manager.css,'
                        dest: 'dest/endpoint_manager.min.css'
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-css');
    grunt.registerTask('default', ['clean', 'concat', 'uglify', 'cssmin']);
};