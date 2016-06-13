var __embed_cdn_path = "https://s3-eu-west-1.amazonaws.com/bas-cdn-dev/embedded-map/";

/* http://stackoverflow.com/questions/11803215/how-to-include-multiple-js-files-using-jquery-getscript-method */
jQuery.getMultiScripts = function (arr, path) {
    var _arr = jQuery.map(arr, function (scr) {
        return jQuery.getScript((path || "") + scr);
    });
    _arr.push(jQuery.Deferred(function (deferred) {
        jQuery(deferred.resolve);
    }));
    return jQuery.when.apply(jQuery, _arr);
}

function addCssToHeader(arr) {
    var exCss = jQuery("head").children("link");
    var insertPoint = null;
    if (exCss.length > 0) {
        insertPoint = jQuery(exCss[exCss.length - 1]);
    }
    jQuery.each(arr, function (idx, elt) {
        var css = jQuery('<link>', {
            rel: "stylesheet",
            type: "text/css",
            href: __embed_cdn_path + elt,
        });
        if (insertPoint != null) {
            insertPoint.after(css);
        } else {
            jQuery("head").prepend(css);
        }
    });
}

/* From http://stackoverflow.com/questions/26397697/fallback-plan-for-loading-fontawesome */
function isFontAwesomeLoaded() {
    var span = document.createElement("span");
    span.className = "fa";
    document.body.appendChild(span);
    var result = (span.style.fontFamily === "FontAwesome");
    document.body.removeChild(span);
    return(result);
}

jQuery(document).ready(function () {
    var escr = jQuery("#map_embed")[0];
    if (escr) {
        var __embed_script_arr = [];
        var __embed_css_arr = [];

        /* Check for bootstrap loaded */
        if (typeof jQuery.fn.popover == "undefined") {
            /* Load Bootstrap JS and CSS */
            console.log("Could not find bootstrap, loading...");
            __embed_script_arr.push("js/bootstrap.min.js");            
            __embed_css_arr.push("css/bootstrap.min.css");
            console.log("Loading complete");
        } else {
            console.log("bootstrap present");
        }
        /* Check for font-awesome loaded */
        if (!isFontAwesomeLoaded) {
            console.log("Could not find font-awesome, loading...");
            __embed_css_arr.push("css/font-awesome.min.css");
            console.log("Loading complete");
        } else {
            console.log("font-awesome present");
        }
        /* Load other js and css */
        __embed_script_arr.push("js/bootbox.min.js");
        __embed_script_arr.push("js/alljs_embed.js");
        __embed_css_arr.push("css/allcss_embed.css");        
        
        var data_url = escr.getAttribute("data-url"),
            data_width = escr.getAttribute("data-width"),
            data_height = escr.getAttribute("data-height"),
            data_container = escr.getAttribute("data-container");
        console.log("------------ Embeddable data ------------");
        console.log("Data URL : " + data_url);
        console.log("Container id : " + data_container);
        console.log("Container width : " + data_width);
        console.log("Container height : " + data_height);
        console.log("-----------------------------------------")
        addCssToHeader(__embed_css_arr);
        jQuery.getMultiScripts(__embed_script_arr, __embed_cdn_path)
        .done(function () {
            console.log("Getting map payload from " + data_url);
            jQuery.ajax({
                url: data_url,
                method: "GET",
                dataType: "json"
            })
            .done(function () {
                console.log("Successful");
                magic.runtime.issuedata = {};
                magic.runtime.appcontainer = new magic.classes.embedded.AppContainer({target: "map"});
            })
            .fail(function () {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to load payload for embedded map from ' + data_url + '</div>');
            });
        })
        .fail(function () {
            bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to load necessary support for embedded maps</div>');
        });
    }
});

