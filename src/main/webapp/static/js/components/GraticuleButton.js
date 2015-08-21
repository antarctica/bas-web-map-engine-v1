/* Show graticule button */

magic.classes.GraticuleButton = function (name, ribbon) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;

    /* Internal properties */
    this.active = false;
    this.graticule = null;

    this.inactiveTitle = "Show graticule";
    this.activeTitle = "Hide graticule";

    this.btn = $('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-table"></span>'
    });
    this.btn.on("click", $.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));
};

magic.classes.GraticuleButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.GraticuleButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.GraticuleButton.prototype.activate = function () {
    this.active = true;
    // TODO - ol graticule component does not seem very robust as of 03/08/2015   
    this.graticule = new ol.Graticule({});
    this.graticule.setMap(magic.runtime.map);
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
};

/**
 * Deactivate the control
 */
magic.classes.GraticuleButton.prototype.deactivate = function () {
    this.active = false;
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
};
    