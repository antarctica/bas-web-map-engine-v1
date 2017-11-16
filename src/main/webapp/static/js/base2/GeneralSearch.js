/* Prototype class for a general search resulting in clickable points on the map */

magic.classes.GeneralSearch = function (options) {    
    magic.classes.NavigationBarTool.call(this, options);
};

magic.classes.GeneralSearch.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.GeneralSearch.prototype.constructor = magic.classes.GeneralSearch;

/**
 * Add a Bootstrap tagsinput plugin widget to the input with given id
 * @param {string} id
 */
magic.classes.GeneralSearch.prototype.addTagsInput = function (id) {
    var elt = jQuery("#" + this.id + "-" + id);
    if (elt.length > 0) {
        var tooltip = elt.attr("title");
        elt.tagsinput({
            trimValue: true,
            allowDuplicates: false,
            cancelConfirmKeysOnEmpty: false
        });
        if (tooltip) {
            /* Locate the input added by the tagsInput plugin to attach tooltip */
            var btInput = elt.closest("div").find(".bootstrap-tagsinput :input");
            if (btInput) {
                btInput.attr("data-toggle", "tooltip");
                btInput.attr("data-placement", "bottom");
                btInput.attr("title", tooltip);
            }
        }
    }
};

/**
 * Populate a Bootstrap tagsinput plugin widget with the give value
 * @param {string} id
 * @param {string} value comma-separated string representing array of values
 */
magic.classes.GeneralSearch.prototype.populateTagsInput = function (id, value) {
    var elt = jQuery("#" + this.id + "-" + id);
    if (elt.length > 0) {
        jQuery.each(value.split(","), function(idx, v) {
            elt.tagsinput("add", v);
        });
    }
};

/**
 * Reset a Bootstrap tagsinput plugin widget by removing all entered values
 * @param {string} id
 */
magic.classes.GeneralSearch.prototype.resetTagsInput = function (id) {
    var elt = jQuery("#" + this.id + "-" + id);
    if (elt.length > 0) {
        elt.tagsinput("removeAll");
    }
};

/**
 * Format error messages about problem fields from validation
 * @param {Object} errors
 * @return {String}
 */
magic.classes.GeneralSearch.prototype.formatErrors = function (errors) {
    var html = "";
    for (var errkey in errors) {
        html += '<p>' + errkey + ' - ' + errors[errkey] + '</p>';
    }
    return(html);
};
