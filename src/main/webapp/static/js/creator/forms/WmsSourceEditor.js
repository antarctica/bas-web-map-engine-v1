/* WMS source editor */

magic.classes.creator.WmsSourceEditor = function (options) {
    
    options = jQuery.extend({}, {
        prefix: "wms-source-editor",
        sourceContext: null,
        formSchema: [
            {"field": "wms_source", "default": ""}, 
            {"field": "feature_name", "default": ""},
            {"field": "style_name", "default": ""},
            {"field": "is_base", "default": false},
            {"field": "is_singletile", "default": false},
            {"field": "is_dem", "default": false},
            {"field": "is_time_dependent", "default": false}
        ]
    }, options);
    
    magic.classes.creator.DataSourceForm.call(this, options);
    
    /* Linked WMS source menus */
    this.wmsMenus = new magic.classes.creator.WmsFeatureLinkedMenus({
        id: this.prefix
    });
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onLoadContext: jQuery.proxy(function(context) {
            this.wmsMenus.init(context);
            var cbOnly = jQuery.grep(this.formSchema, function(elt) {
                return(elt.field.indexOf("is_") == 0);
            });
            magic.modules.Common.jsonToForm(cbOnly, context, this.prefix);
        }, this)
    }));
    
};

magic.classes.creator.WmsSourceEditor.prototype = Object.create(magic.classes.creator.DataSourceForm.prototype);
magic.classes.creator.WmsSourceEditor.prototype.constructor = magic.classes.creator.WmsSourceEditor;

magic.classes.creator.WmsSourceEditor.prototype.markup = function () {
    return(
        this.wmsMenus.markup() + 
        '<div class="form-group">' +
            '<div class="col-md-offset-3 col-md-9">' +
                '<div class="checkbox">' +
                    '<label>' +
                        '<input type="checkbox" id="' + this.prefix + '-is_base" name="' + this.prefix + '-is_base" value="base" ' +
                            'data-toggle="tooltip" data-placement="left" title="Tick if base (backdrop) layer">' +
                        '</input>Layer is a base (backdrop) layer' +
                    '</label>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<div class="col-md-offset-3 col-md-9">' +
                '<div class="checkbox">' +
                    '<label>' +
                        '<input type="checkbox" id="' + this.prefix + '-is_singletile" name="' + this.prefix + '-is_singletile" value="singletile" ' + 
                            'data-toggle="tooltip" data-placement="left" title="Tick to use a single tile (for large rasters, or layers that need wide area labelling)">' +
                        '</input>Layer rendered as one large tile' +
                    '</label>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<div class="col-md-offset-3 col-md-9">' +
                '<div class="checkbox">' +
                    '<label>' +
                        '<input type="checkbox" id="' + this.prefix + '-is_dem" name="' + this.prefix + '-is_dem" value="dem" ' +
                            'data-toggle="tooltip" data-placement="left" title="Tick if this layer is a DEM to be used in elevation measurement">' +
                        '</input>Layer is a Digital Elevation Model (DEM)' +
                    '</label>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<div class="col-md-offset-3 col-md-9">' +
                '<div class="checkbox">' +
                    '<label>' +
                        '<input type="checkbox" id="' + this.prefix + '-is_time_dependent" name="' + this.prefix + '-is_time_dependent" value="timedep" ' + 
                            'data-toggle="tooltip" data-placement="left" title="Tick if this layer has a time dimension">' +
                        '</input>Layer has a time dimension' +
                    '</label>' +
                '</div>' +
            '</div>' +
        '</div>'
    );
};

magic.classes.creator.WmsSourceEditor.prototype.sourceSpecified = function () {
    return(this.wmsMenus.sourceSpecified());
};

magic.classes.creator.WmsSourceEditor.prototype.validate = function () {
    return(this.wmsMenus.validate());
};