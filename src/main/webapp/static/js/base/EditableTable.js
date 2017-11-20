/* Prototype class for editable table forms */

magic.classes.EditableTable = function (tableContainerId, rowSchema, displayOrder, displayAddBtn) {

    /* === API properties === */
    
    this.tableContainerId = tableContainerId;

    /* Container for table */
    this.container = jQuery("#" + tableContainerId);

    /* Table row schema */
    this.rowSchema = rowSchema;
    
    /* Display order for table cells */
    this.displayOrder = displayOrder;
    
    /* Whether to display an "add new record" button */
    this.displayAddBtn = displayAddBtn;
    
    /* Initialise the table */
    this.defaultMarkup();
    
};

magic.classes.EditableTable.prototype.appendRow = function(data) {
    var pk = data.id;
    var table = this.container.find("table");
    /* Initialise table header */
    var html = "";
    if (table.hasClass("no-records")) {
        html = '<tr>';
        jQuery.each(this.displayOrder, jQuery.proxy(function(idx, name) {
            html += '<th>' + (this.rowSchema[name].header || magic.modules.Common.initCap(name)) + '</th>';
        }, this));
        html += '</tr>';
        table.removeClass("no-records");
    }
    /* Display data row */
    html += '<tr>';
    jQuery.each(this.displayOrder, jQuery.proxy(function(idx, name) {
        var inputId = this.tableContainerId + '-' + pk + '-' + name;
        var inputType = "text"; //this.getInputType(name);
        html += '<td><a href="JavaScript:void(0)" id="' + inputId + '" data-type="' + inputType + '" data-pk="' + pk + '">' + data[name] + '</a></td>';
        jQuery("#" + inputId).editable();
    }, this));    
    html += '</tr>';
    table.append(html);
};

magic.classes.EditableTable.prototype.defaultMarkup = function() {
    this.container.html(
        '<table class="table table-striped table-responsive table-condensed no-records"><table>' +             
        '<button id="' + this.tableContainerId + '-add-btn" class="btn btn-primary btn-sm" type="button" ' +
            'data-toggle="tooltip" data-placement="right" title="Save the current map view">' +
            '<span class="fa fa-floppy-o"></span>' +
        '</button>'
    );
};
