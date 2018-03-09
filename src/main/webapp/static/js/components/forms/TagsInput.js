/* Custom input based on Bootstrap tagsinput class */

magic.classes.TagsInput = function(options) {

    options = jQuery.extend({}, {
        tipText: "",
        tipPosition: "left",
        required: false,
        defaultValue: ""
    }, options);
    
    magic.classes.CustomFormInput.call(this, options);
    
    this.tipText = this.tipText || this.element.data("original-title");
        
    if (this.element.length > 0) {
        this.element.tagsinput({
            trimValue: true,
            allowDuplicates: false,
            cancelConfirmKeysOnEmpty: false
        });        
        if (this.tipText) {
            /* Locate the input added by the tagsInput plugin to attach tooltip */
            var btInput = this.element.closest("div").find(".bootstrap-tagsinput :input");
            if (btInput) {
                btInput.attr("data-toggle", "tooltip");
                btInput.attr("data-placement", this.tipPosition);
                btInput.attr("title", this.tipText);
            }
        }
    }
    
    this.setValue(this.defaultValue);

};

magic.classes.TagsInput.prototype = Object.create(magic.classes.CustomFormInput.prototype);
magic.classes.TagsInput.prototype.constructor = magic.classes.TagsInput;

/**
 * Reset the input
 */
magic.classes.TagsInput.prototype.reset = function() {
    this.element.tagsinput("removeAll");
};

/**
 * Set tags input to the given input value (supplied as a comma-separated string or an array)
 * @param {String|Array} value
 */
magic.classes.TagsInput.prototype.setValue = function(value) {
    if (!value) {
        this.reset();
    } else {
        if (!jQuery.isArray(value)) {
            value = value.split(",");
        }
        if (value.length > 0) {
            jQuery.each(value, jQuery.proxy(function(idx, v) {
                this.element.tagsinput("add", v);
            }, this));
        }
    }
};

/**
 * Retrieve the set value as a comma-separated string or array
 * @param {boolean} requireArray
 * @return {String|Array}
 */
magic.classes.TagsInput.prototype.getValue = function(requireArray) {
    if (requireArray === true) {
        return(this.element.tagsinput("items"));
    } else {
        return(this.element.val());
    }
};