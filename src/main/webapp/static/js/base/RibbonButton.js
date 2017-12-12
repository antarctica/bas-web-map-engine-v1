/* Base class for a control ribbon button */

magic.classes.RibbonButton = function (options) {

    /* API properties */
    this.name = options.name;
    this.ribbon = options.ribbon;
    this.inactiveTitle = options.inactiveTitle;
    this.activeTitle = options.activeTitle;

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

magic.classes.RibbonButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.RibbonButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 * @param {Function} onActivate callback
 */
magic.classes.RibbonButton.prototype.activate = function (onActivate) {
    this.active = true;
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
};

/**
 * Deactivate the control
 * @param {Function} onDeactivate callback
 */
magic.classes.RibbonButton.prototype.deactivate = function (onDeactivate) {
    this.active = false;    
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
};
    