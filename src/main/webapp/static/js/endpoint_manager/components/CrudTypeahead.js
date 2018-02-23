/* Adds typeahead functionality to a text input */

magic.classes.CrudTypeahead = function(options) {
    
    /* API properties */
    
    /* Identifier of the text input to override */
    this.target = options.target;
         
    /* API call to generate suggestions (contains a placeholder {query} to be substituted with user input) */
    this.api = options.api;
    
    /* Field to display in suggestions */
    this.displayField = options.displayField;
    
    /* Tabulate suggestions? */
    this.tabulate = options.tabulate || false;
    
    /* What to do with the suggestions (specific to application) */
    this.callback = options.callback;    
    
    /* End of API properties */
    
    /* Internal properties */
    
    this.targetJq = $("#" + this.target);       
    
    /* End of internal properties */    
    
    this.targetJq.typeahead({minLength: 4, highlight: true}, this.getConfig())
        .on("typeahead:autocompleted", $.proxy(this.selectHandler, this))
        .on("typeahead:selected", $.proxy(this.selectHandler, this))
        .on("typeahead:render", function() {
            /* Implement hovers to make the selection process more positive for the user */
            $("div.common-table-row").on("mouseover", function(evt) {
                $(evt.currentTarget).css("background-color", "#D9EDF7");
            }).on("mouseout", function(evt) {
                $(evt.currentTarget).css("background-color", "#ffffff");
            });
        });                    
    
};

magic.classes.CrudTypeahead.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.CrudTypeahead.prototype.selectHandler = function(evt, suggestion) {
    this.targetJq.typeahead("val", suggestion[this.displayField]);
    this.callback(suggestion);
};

/**
 * Package up data from API in the form typeahead plugin requires to 
 * @returns {Array}
 */
magic.classes.CrudTypeahead.prototype.getConfig = function() {    
    return({
        source: $.proxy(this.getSource, this),
        display: $.proxy(this.getDisplay, this),
        limit: 100,
        templates: this.getTemplates()
    });
};

magic.classes.CrudTypeahead.prototype.getSource = function(query, syncResults, asyncResults) {
    var url = this.api.replace("{query}", query);
    var jqXhr = $.getJSON(url, function(json) {
        asyncResults(json.data);
    }).fail(function(xhr, status, err) {
        var detail = JSON.parse(xhr.responseText)["detail"];
        if (detail.indexOf("characters to trigger search") < 0) {
            /* Don't consider too few search characters a reportable error */
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Failed to get suggestions - detail below:</p>' + 
                    '<p>' + detail + '</p>' + 
                '</div>'
            );
        }
    });         
};

magic.classes.CrudTypeahead.prototype.getDisplay = function(value) {
    if (this.tabulate) {
        /* Tabulated output */
        var nkeys = 0;
        var keys = $.map(value, function(v, k) {
            if (k.indexOf("_") != 0) {
                nkeys++;
                return(k)
            }
        });
        var percent = 100/nkeys;
        keys.sort();
        var dataLine = 
            '<div class="common-table common-table-row">' + 
                '<div style="width:100%">';
        $.each(keys, function(idx, k) {
            dataLine += '<div style="width:' + percent + '%">' + value[k] + '</div>';
        });
        dataLine += 
                '</div>' + 
            '</div>';
        return(dataLine);        
    } else {
        return(value[this.displayField]);
    }
};

magic.classes.CrudTypeahead.prototype.getTemplates = function(value) {
    if (this.tabulate) {
        /* Tabulated output */
        return({
            notFound: '<p class="suggestion">No suggestions</p>',
            header: function(query) {
                if ($.isArray(query.suggestions) && query.suggestions.length > 0) {
                    var sugg = query.suggestions[0];
                    var nkeys = 0;
                    var keys = $.map(sugg, function(v, k) {
                        if (k.indexOf("_") != 0) {
                            nkeys++;
                            return(k.substring(0, 1).toUpperCase() + k.substring(1));
                        }
                    });
                    var percent = 100/nkeys;
                    keys.sort();
                    /* This is a <div> style table, as true tables don't work at all - see http://stackoverflow.com/questions/31141240/wrap-typeahead-suggestions-in-a-table */
                    var headerLine = 
                        '<div class="common-table" style="background-color:#f5f5f5">' + 
                            '<div style="width:100%">';
                    $.each(keys, function(idx, k) {
                        headerLine += '<div style="width:' + percent + '%"><strong>' + k + '</strong></div>';
                    });
                    headerLine += 
                            '</div>' + 
                        '</div>';
                }                
                return(headerLine);
            },
            suggestion: $.proxy(function(value) {                
                return(this.getDisplay(value));
            }, this)
        });        
    } else {
        return({
            notFound: '<p class="suggestion">No suggestions</p>',
            header: '<div class="suggestion-group-header">Suggestions</div>',
            suggestion: $.proxy(function(value) {                
                return('<p class="suggestion">' + value[this.displayField] + '</p>');
            }, this)
        });
    }
};


