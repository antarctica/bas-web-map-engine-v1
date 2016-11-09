/* Global "magic" namespace */

var magic = {
    
    /* Common quantities */
    common: {
        creator: {}
    },
    
    /* Layer and view configuration */
    config: {
        paths: {
            baseurl: (window.location.origin || (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port: "")))
        }
    },        
    
    /* Static modules */
    modules: {
        creator: {}
    },
    
    /* Instantiable classes */
    classes: {
        creator: {},
        console: {},
        publisher: {}
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
        highlighted: [],
        highlighted_inset: [],
        pingSession: function() {
            jQuery.get(magic.config.paths.baseurl + "/ping");
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

