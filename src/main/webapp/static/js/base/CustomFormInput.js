/* Prototype custom form input class */

magic.classes.CustomFormInput = function(options) {

    this.id = options.id;
    this.tipText = options.tipText;
    this.tipPosition = options.tipPosition;
    this.defaultValue = options.defaultValue;
	this.required = options.required;
    
    this.element = jQuery("#" + this.id);

};

magic.classes.CustomFormInput.prototype.getElement = function() {
    return(this.element);
};
