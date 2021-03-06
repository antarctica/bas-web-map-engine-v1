/* Global "magic" namespace */

var magic = {
    
    /* Layer and view configuration */
    config: {
        paths: {
            baseurl: (window.location.origin || (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port: ""))),
            cdn: "https://cdn.web.bas.ac.uk/magic"
        }
    },        
    
    /* Static modules */
    modules: {
        creator: {}
    },
    
    /* Instantiable classes */
    classes: {
        creator: {},
        console: {}
    },
    
    /* Runtime objects */
    runtime: {
        creator: {
            catalogues: {}
        }, 
        capabilities: {            
        },
        filters: {            
        },
        pingSession: function() {
            jQuery.get(magic.config.paths.baseurl + "/ping");
        },
        /* Courtesy of https://stackoverflow.com/questions/11803215/how-to-include-multiple-js-files-using-jquery-getscript-method, Andrei's answer */
        getScripts: function(scripts, callback) {
            var progress = 0;
            scripts.forEach(function(script) { 
                jQuery.getScript(script, function () {
                    if (++progress == scripts.length) callback();
                }); 
            });
        },
        /* Eventually per-user */
        preferences: {
            coordinate: "dd",
            elevation: "m",
            date: "Y-m-d"
        }
    }
    
};

/* Activate session keepalive by application request every 50 mins */
setInterval("magic.runtime.pingSession()", 50*60*1000);


