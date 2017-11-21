/* Prototype class for editable table forms */

magic.classes.EditableTable = function (options) {

    /* === API properties === */
    
    this.tableContainerId = options.tableContainerId;

    /* Container for table */
    this.container = jQuery("#" + this.tableContainerId);

    /* Table row schema */
    this.rowSchema = options.rowSchema;
    
    /* Display order for table cells */
    this.displayOrder = options.displayOrder;
    
    /* Whether to display an "add new record" button */
    this.displayAddBtn = options.displayAddBtn;
    
    /* Initialise the table */
    this.defaultMarkup();
    
};

magic.classes.EditableTable.prototype.appendRow = function(data) {
    var pk = data.id;
    console.log("Appending row - pk = " + pk);
    console.log(data);
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
        table.empty();
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
    table.html(html);
};

magic.classes.EditableTable.prototype.defaultMarkup = function() {
    this.container.html(
        '<table class="table table-striped table-responsive table-condensed no-records">' + 
            '<tr><td>No entries found</td></tr>' +
        '<table>' + 
        '<button id="' + this.tableContainerId + '-add-btn" class="btn btn-primary btn-sm" type="button" ' +
            'data-toggle="tooltip" data-placement="right" title="Add a new record">' +
            '<span class="fa fa-star"></span>' +
        '</button>'
    );
};
