/* Prototype class for data source editing */

magic.classes.creator.DataSourceForm = function (options) {

    /* External API options */
    this.prefix = options.prefix;
    
    this.sourceContext = options.sourceContext;
    
    this.region = options.region;
    
    this.formSchema = options.formSchema;
    
    /* Internal */
    this.controlCallbacks = {};
  
};

magic.classes.creator.DataSourceForm.prototype.loadContext = function(context) {
    if (!context) {
        context = this.defaultData();
    }
    if (jQuery.isFunction(this.controlCallbacks.onLoadContext)) {
        this.controlCallbacks.onLoadContext(context);
    }
};

magic.classes.creator.DataSourceForm.prototype.formToPayload = function(context) {
    return({
        "source": magic.modules.Common.formToJson(this.formSchema, this.prefix)
    });
};

magic.classes.creator.DataSourceForm.prototype.defaultData = function() {
    var defaultData = {};
    jQuery.each(this.formSchema, jQuery.proxy(function(idx, elt) {
        defaultData[elt["field"]] = elt["default"];
    }, this));
    return(defaultData);
};

magic.classes.creator.DataSourceForm.prototype.setCallbacks = function(callbacksObj) {
    this.controlCallbacks = callbacksObj;
};


