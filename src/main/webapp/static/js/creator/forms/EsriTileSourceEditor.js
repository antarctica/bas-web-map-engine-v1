/* WMS source editor */

magic.classes.creator.EsriTileSourceEditor = function (options) {
    
    options = jQuery.extend({}, {
        prefix: "esritile-source-editor",
        sourceContext: null,
        formSchema: [
            {"field": "esritile_source", "default": ""},           
            {"field": "is_base", "default": false}
        ],
        onSaveContext: function() {}
    }, options);
    
    magic.classes.creator.DataSourceForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSaveContext: jQuery.proxy(this.onSaveContext, this)
    }));  
    
    /* Linked WMS source menus */
    this.wmsMenus = new magic.classes.creator.WmsFeatureLinkedMenus({
        id: this.prefix
    });
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onLoadContext: jQuery.proxy(function(context) {
            var cbOnly = jQuery.grep(this.formSchema, function(elt) {
                return(elt.field.indexOf("is_") == 0);
            });
            magic.modules.Common.jsonToForm(cbOnly, context, this.prefix);
        }, this)
    }));
    
};

magic.classes.creator.EsriTileSourceEditor.prototype = Object.create(magic.classes.creator.DataSourceForm.prototype);
magic.classes.creator.EsriTileSourceEditor.prototype.constructor = magic.classes.creator.EsriTileSourceEditor;

magic.classes.creator.EsriTileSourceEditor.prototype.markup = function () {
    return(
        '<div class="form-group">' + 
            '<label for="' + this.prefix + '-esritile_source" class="col-md-3 control-label">Feed URL</label>' + 
            '<div class="col-md-9">' + 
                '<input type="url" class="form-control" id="' + this.prefix + '-esritile_source" name="' + this.prefix + '-esritile_source" ' +  
                       'placeholder="URL of ESRI Tile source" required="required" ' + 
                       'data-toggle="tooltip" data-placement="left" title="Source URL for ArcGIS Online Tile feed">' +                                    
                '</input>' + 
            '</div>' + 
        '</div>' +     
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
        '</div>'        
    );
};

magic.classes.creator.EsriTileSourceEditor.prototype.validate = function () {
    return(magic.modules.Common.isUrl(jQuery("#" + this.prefix + "-esritile_source").val()));
};