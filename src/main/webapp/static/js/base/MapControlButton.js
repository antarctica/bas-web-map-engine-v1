/* Base class for a map control ribbon button */

magic.classes.MapControlButton = function (options) {

    /* API properties */
    this.name = options.name;
    this.ribbon = options.ribbon;
    this.inactiveTitle = options.inactiveTitle;
    this.activeTitle = options.activeTitle;
    
    this.map = options.map || magic.runtime.map;
    
    /* Callbacks */
    this.onActivate = options.onActivate;
    this.onDeactivate = options.onDeactivate;

    /* Internal properties */
    this.active = false;
   
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default ribbon-middle-tool active",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.activeTitle,
        "html": '<span class="fa fa-table"></span>'
    });
    this.btn.on("click", jQuery.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));
    
};

magic.classes.MapControlButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.MapControlButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.MapControlButton.prototype.activate = function () {
    this.active = true;
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
    if (jQuery.isFunction(this.onActivate)) {
        this.onActivate();
    }
};

/**
 * Deactivate the control
 */
magic.classes.MapControlButton.prototype.deactivate = function () {
    this.active = false;    
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
    if (jQuery.isFunction(this.onDeactivate)) {
        this.onDeactivate();
    }
};
    