/* Adds typeahead functionality to a text place-name input */

magic.classes.CrudFormset = function(options) {
    
    /* API properties */
    
    /* DOM identifier of the search records form */
    this.searchForm = options.searchForm;
    
    this.searchTypeahead = options.searchTypeahead;
    
    /* Suggestion field to search on */
    this.searchField = options.searchField;
    
    /* DOM identifier of the edit record form, assumed to end in -form */
    this.form = options.form;
    
    /* API call to implement a search or field lookup (will contain a placeholder {query} to be substituted) */
    this.lookupApi = options.lookupApi;
             
    /* API call to populate a record (will contain a placeholder {id} to be substituted by user id input) */
    this.formReadApi = options.formReadApi;
    
    /* API call to edit a record (will contain an {op} placeholder to be substituted for "insert" or "update" */
    this.formWriteApi = options.formWriteApi;
        
    /**
     * Typeahead fields, and instructions
     * Properties:
     *   srcField  - DOM identifier of the text typeahead field
     *   srcAttr   - attribute from the suggestion to set as source field value
     *   destField - DOM identifier of the target field
     *   destAttr  - attribute from the suggestion to set as target field value
     */
    this.lookups = options.lookups || {};
        
    /* End of API properties */
    
    /* Internal properties */
    
    this.prefix = this.form.replace(/form$/, "");
    
    this.searchFormJq = jQuery("#" + this.searchForm);
            
    this.formJq = jQuery("#" + this.form);
    
    /* Original data fetched from API */
    this.data = {};
    
    /* Is the record form dirty i.e. do we need to prompt user to save changes? */
    this.dirty = false;
    
    /* End of internal properties */
    
    /* Attach typeaheads */
    if (!jQuery.isEmptyObject(this.lookups)) {
        jQuery.each(this.lookups, jQuery.proxy(function(fld, opts) {
            new magic.classes.CrudTypeahead({
                target: opts.srcField,
                api: this.lookupApi,
                displayField: opts.srcAttr,
                callback: jQuery.proxy(function(suggestion) {
                    jQuery("#" + this.destField).val(suggestion[this.destAttr]);
                }, opts)
            });
        }, this));
    }
    
    /* Link search form to a typeahead */
    if (this.searchForm && this.searchTypeahead) {
        new magic.classes.CrudTypeahead({
            target: this.searchFormJq.find("input[id$='search-ta']").attr("id"),
            displayField: this.searchField,
            api: this.lookupApi,
            tabulate: true,
            callback: jQuery.proxy(function(suggestion) {
                this.populateForm(suggestion.id);
            }, this)

        });
    }
        
    this.formJq.find(":input").on("keyup", jQuery.proxy(function() {
        this.dirty = true;
    }, this));  
    
    jQuery("#" + this.form + "-submit").click(jQuery.proxy(function() {
        if (this.validateForm()) {            
            var data = {};
            this.formJq.find(":input").each(jQuery.proxy(function(idx, elt) {
                var eltJq = jQuery(elt);
                var fldName = eltJq.attr("name");
                var fldVal = eltJq.val();
                if (fldName) {
                    /* Interesting form input */
                    if (fldVal == "") {
                        /* Fields should have null values, not empty strings => translate to Postgres NULL */
                        fldVal = null;
                    }
                    if (fldName.indexOf("lat") >= 0 || fldName.indexOf("lon") >= 0) {
                        if (fldVal) {
                            /* Convert lon/lat to decimal degrees if they aren't in this format already */
                            fldVal = magic.modules.GeoUtils.toDecDegrees(fldVal);
                        } else {
                            fldVal = null;
                        }
                    }
                    if (fldVal && !jQuery.isNumeric(fldVal)) {
                        /* Strip unnecessary whitespace */
                        fldVal = fldVal.trim();
                    }
                    data[fldName.replace(this.prefix, "")] = fldVal;
                }
            }, this));            
            //console.log(data);
            var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
            var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
            var isInsert = !data.id || (jQuery.isNumeric(data.id) && parseInt(data.id) < 0);
            var jqXhr = jQuery.ajax({
                url: this.formWriteApi.replace("{op}", isInsert ? "insert" : "update"),               
                method: isInsert ? "POST" : "PUT",
                processData: false,
                data: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json"
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader(csrfHeader, csrfHeaderVal)
                }
            });
            jqXhr.done(jQuery.proxy(function(response) {
                //console.log(response);
                bootbox.alert(
                    '<div class="alert alert-success" style="margin-bottom:0">' + 
                        '<p>Successfully saved</p>' + 
                    '</div>', jQuery.proxy(function() {
                        this.dirty = false;
                        this.clearForm();
                    }, this)
                );
            }, this));
            jqXhr.fail(function(xhr, status, err) {
                var detail = JSON.parse(xhr.responseText)["detail"];
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Failed to save your data - details below:</p>' + 
                        '<p>' + detail + '</p>' + 
                    '</div>'
                );
            });            
        } else {
            bootbox.alert(
                '<div class="alert alert-danger" style="margin-bottom:0">' + 
                    '<p>Please correct the invalid fields marked</p>' + 
                '</div>'
            );
        }
    }, this));
    
    jQuery("#" + this.form + "-revert").click(jQuery.proxy(function() {
        this.confirmAction(jQuery.proxy(this.dictToForm, this), this.data);
    }, this));
    
    jQuery("#" + this.form + "-new").click(jQuery.proxy(function() {
        this.confirmAction(jQuery.proxy(this.clearForm, this), null);
    }, this));
    
};

/**
 * Populate form with API data
 * @param {String} id
 */
magic.classes.CrudFormset.prototype.populateForm = function(id) {
    var readUrl = this.formReadApi.replace("{id}", id);
    jQuery.getJSON(readUrl, jQuery.proxy(function(json) {
        this.data = json.data;
        if (this.data && this.formJq) {
            /* Populate form with data */
            if (this.dirty === true) {
                /* Confirm before overwriting user's changes */
                this.confirmAction(jQuery.proxy(this.dictToForm, this), this.data);                
            } else {
                this.dictToForm(this.data);
            }
        } else {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Malformed response from server when fetching data</p>' + 
                '</div>'
            );
        }
    }, this)).fail(function(xhr) {
        var detail = JSON.parse(xhr.responseText)["detail"];
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>Error fetching data - detail below:</p>' + 
                '<p>' + detail + '</p>' + 
            '</div>'
        );
    });                    
};

/**
 * Clear the form entirely
 */
magic.classes.CrudFormset.prototype.clearForm = function() {
    if (this.dirty === true) {
        /* Confirm before losing user's changes */
        this.confirmAction(jQuery.proxy(function() {
            this.formJq[0].reset();
        }, this), null);                
    } else {
        this.formJq[0].reset();
    }   
    this.dirty = false;
    this.formJq.find("div.form-group").removeClass("has-error");
};

/**
 * Validate the form according to the criteria expressed in HTML
 * @return boolean
 */
magic.classes.CrudFormset.prototype.validateForm = function() {
    var ok = this.formJq[0].checkValidity();
    jQuery.each(this.formJq.find("input[name^='" + this.prefix + "'],textarea[name^='" + this.prefix + "']"), function(idx, fip) {
        var fipEl = jQuery(fip);
        var fg = fipEl.closest("div.form-group");
        var vState = fipEl.prop("validity");
        if (vState.valid) {
            fg.removeClass("has-error");
        } else {
            fg.addClass("has-error");
        }
    });
    return(ok);
};

/**
 * Populate form with the given data, resetting the dirty flag
 * @param {Object} data
 */
magic.classes.CrudFormset.prototype.dictToForm = function(data) {
    this.formJq[0].reset();
    jQuery.each(data, jQuery.proxy(function(attr, value) {
        var fiName = attr.substring(attr.lastIndexOf("-")+1);
        if (fiName) {
            var fi = jQuery("#" + this.prefix + attr);
            if (fi.length > 0) {
                if (fi.attr("type") == "checkbox" || fi.attr("type") == "radio") {
                    fi.prop("checked", value === true);
                } else {
                    fi.val(value);
                }
            }
        }
    }, this));
    this.dirty = false;
    this.formJq.find("div.form-group").removeClass("has-error");
};

/**
 * Allow a user confirmation for an action, invoking the given callback with data
 * @param {Function} callback
 * @param {Object} data
 */
magic.classes.CrudFormset.prototype.confirmAction = function(callback, data) {
    bootbox.confirm(
        '<div class="alert alert-warning" style="margin-bottom:0">' + 
            '<p>Continue and lose your changes?</p>' + 
        '</div>', jQuery.proxy(function(result) {
            if (result) {
                callback(data);
            }
        }, this)
    );
};
