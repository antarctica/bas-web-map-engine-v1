/* Custom input based on Bootstrap multiple select class */

magic.classes.MultiSelectInput = function(options) {

    options = jQuery.extend({}, {
        tipText: "",
        tipPosition: "left",
        required: false,
        defaultValue: ""
    }, options);
    
    magic.classes.CustomFormInput.call(this, options);
    
    /* Capture tooltip specification from original element */
    this.tipText = this.tipText || this.element.data("original-title");
            
    this.element.attr("multiple", "multiple");
    this.element.addClass("selectpicker");
    this.element.selectpicker({
        iconBase: "fa",
        tickIcon: "fa-check"
    });
    
    this.element.closest("div.bootstrap-select").tooltip({
        title: this.tipText,
        placement: this.tipPosition,
        container: "body"
    });
    
    if (this.defaultValue == "") {
        this.reset();
    } else {
        this.setValue(this.defaultValue);
    }

};

magic.classes.MultiSelectInput.prototype = Object.create(magic.classes.CustomFormInput.prototype);
magic.classes.MultiSelectInput.prototype.constructor = magic.classes.MultiSelectInput;

/**
 * Reset the input
 */
magic.classes.MultiSelectInput.prototype.reset = function() {
    this.element.selectpicker("deselectAll");
};

/**
 * Set tags input to the given input value (supplied as a comma-separated string or an array)
 * @param {String|Array} value
 */
magic.classes.MultiSelectInput.prototype.setValue = function(value) {
    if (!value) {
        this.reset();
    } else {
        if (!jQuery.isArray(value)) {
            value = value.split(",");
        }
        if (value.length > 0) {
            this.element.selectpicker("val", value);
        }
    }
};

/**
 * Retrieve the set value as a comma-separated string or array
 * @param {boolean} requireArray
 * @return {String|Array}
 */
magic.classes.MultiSelectInput.prototype.getValue = function(requireArray) {    
    return(this.element.val());
};