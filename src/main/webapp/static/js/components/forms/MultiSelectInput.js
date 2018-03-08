/* Custom input based on Bootstrap multiple select class */

magic.classes.MultiSelectInput = function(options) {

    options = jQuery.extend({}, {
        tipText: "Allows multiple selections",
        tipPosition: "left",
        required: false,
        defaultValue: ""
    }, options);
    
    magic.classes.CustomFormInput.call(this, options);
            
    this.element.attr("multiple", "multiple");
    this.element.addClass("selectpicker");
    this.element.selectpicker({
        iconBase: "fa",
        tickIcon: "fa-check"
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
    if (!jQuery.isArray(value)) {
        value = value.split(",");
    }
    if (value.length > 0) {
        this.element.selectpicker("val", value);
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