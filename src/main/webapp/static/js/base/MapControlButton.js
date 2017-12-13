/* Base class for a map control ribbon button */

magic.classes.MapControlButton = function (options) {

    /* API properties */
    this.name = options.name;
    this.ribbon = options.ribbon;
    this.inactiveTitle = options.inactiveTitle;
    this.activeTitle = options.activeTitle;
    this.activeBtnClass = options.activeBtnClass;
    this.inactiveBtnClass = options.inactiveBtnClass;
    this.startActive = options.startActive === true || false;
    
    this.map = options.map || magic.runtime.map;
    
    /* Callbacks */
    this.onActivate = options.onActivate;
    this.onDeactivate = options.onDeactivate;

    /* Internal properties */
    this.active = this.startActive;
   
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default ribbon-middle-tool" + (this.startActive ? " active" : ""),
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": (this.startActive ? this.activeTitle : this.inactiveTitle),
        "html": '<span class="' + (this.startActive ? this.activeBtnClass : this.inactiveBtnClass) + '"></span>'
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
    this.btn.children("span").removeClass(this.inactiveBtnClass).addClass(this.activeBtnClass);
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
    this.btn.children("span").removeClass(this.activeBtnClass).addClass(this.inactiveBtnClass);
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
    if (jQuery.isFunction(this.onDeactivate)) {
        this.onDeactivate();
    }
};
    