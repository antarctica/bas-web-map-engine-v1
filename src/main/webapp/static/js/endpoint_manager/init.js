/* Global "magic" namespace */

var magic = {
    
    /* Layer and view configuration */
    config: {
        paths: {
            baseurl: (window.location.origin || (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port: "")))
        }
    },        
    
    /* Static modules */
    modules: {
    },
    
    /* Instantiable classes */
    classes: {
        endpoint_manager: {}
    },
    
    /* Runtime objects */
    runtime: {        
        pingSession: function() {
            jQuery.get(magic.config.paths.baseurl + "/ping");
        }
    }
    
};

/* Activate session keepalive by application request every 50 mins */
setInterval("magic.runtime.pingSession()", 50*60*1000);

