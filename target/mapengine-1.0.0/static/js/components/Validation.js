/* Static validation methods module */

magic.classes.Validation = function(options) {
    
    /**
     * Validation rules, array of objects with fields:
     *  field: <id_of_field> - string,
     *  type: <validation_type> - longitude|latitude|required (array|string)
     *  allowBlank: <allow_empty_value> - boolean
     */
    this.rules = options.rules;
    
    /* Validation errors - array of objects {field: <id_of_field>, msg: [<message>]} */
    this.errors = [];
    
};

/**
 * Set up handlers corresponding to the rules, and reset any error conditions within given container
 * @param {Object} container
 */
magic.classes.Validation.prototype.init = function(container) {
    /* Clear errors */
    this.errors = [];
    if (container) {
        container.find("div.form-group.has-error").removeClass("has-error");
    } else {
        $("div.form-group.has-error").removeClass("has-error");
    }
    /* Set handlers */
    $.each(this.rules, $.proxy(function(idx, rule) {
        $("#" + rule.field).blur(rule, $.proxy(this.validateField, this));
    }, this));   
};

/**
 * Apply all the current validation rules
 * @returns {boolean}
 */
magic.classes.Validation.prototype.validateAll = function() {
    this.errors = [];
    $.each(this.rules, function(idx, rule) {
        $("#" + rule.field).blur();
    });
    return(this.errors.length == 0);
};

/**
 * Blur handler for fields
 * @param {jQuery.Event} evt
 */
magic.classes.Validation.prototype.validateField = function(evt) {
    var rule = evt.data,
        id = evt.currentTarget.id,
        value = $(evt.currentTarget).prop("value");
    /* Delete any current errors on this field */
    this.errors = $.grep(this.errors, function(item) {
        return(item.field != id);
    });
    var fieldError = {
        field: id,
        msg: []
    };
    var criteria = !$.isArray(rule.type) ? [rule.type] : rule.type;
    $.each(criteria, $.proxy(function(idx, criterion) {
        switch(criterion) {
            case "required":
                if (!value) {
                    fieldError.msg.push("This field is required");
                }
                break;
            case "longitude":
                if (!magic.modules.GeoUtils.validCoordinate(value, false, rule.allowBlank)) {
                    fieldError.msg.push("Not a valid longitude");
                }
                break;
            case "latitude":
                if (!magic.modules.GeoUtils.validCoordinate(value, true, rule.allowBlank)) {
                    fieldError.msg.push("Not a valid latitude");
                }
                break;
            default:
                break;
        }
        
    }, this));
    if (fieldError.msg.length > 0) {
        $(evt.currentTarget).closest("div.form-group").addClass("has-error");
        this.errors.push(fieldError);
    } else {
        $(evt.currentTarget).closest("div.form-group").removeClass("has-error");
    }
};		