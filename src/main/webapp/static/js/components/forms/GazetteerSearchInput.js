/* Gazetteer search input control */

magic.classes.GazetteerSearchInput = function(containerId, baseId, suggestionCallbacks, gazetteers, minLength) {
    
    /* Constants */
    this.LOCATIONS_API = "https://api.bas.ac.uk/locations/v1/gazetteer";
    
    /* div to contain the composite input */
    this.container = jQuery("#" + containerId);
        
    /* Identifier stem for id-ing the inputs */
    this.baseId = baseId || "geosearch";
    
    /* Suite of callbacks for typeahead suggestions
     * Valid keys are:
     *  mouseover(event)
     *  mouseout(event)
     *  select(event)
     *  search(event)
     */
    this.suggestionCallbacks = suggestionCallbacks || {};
    
    /* List of gazetteer names to query */
    this.gazetteers = gazetteers || ["cga"];
    
    /* Minimum length of string before typeahead kicks in */
    this.minLength = minLength || 4;
    
    /* Internals */
    
    /* Temporary list of suggestions for working the mouseover overlays */
    this.searchSuggestions = {};
    
    /* The selected suggestion */
    this.currentSearch = null;
    
    /* Get metadata about gazetteers, keyed by name, and set source information for typeahead */
    this.sources = null;
    this.gazetteerData = {};
    jQuery.getJSON(this.LOCATIONS_API, jQuery.proxy(function (payload) {
        /* Get gazetteer metadata keyed by gazetteer name */
        jQuery.map(payload.data, jQuery.proxy(function (gd) {
            this.gazetteerData[gd.gazetteer] = gd;
        }, this));
        /* Set up sources for typeahead input */
        this.sources = jQuery.map(this.gazetteers, jQuery.proxy(function (gaz) {
            return({
                source: jQuery.proxy(function (query, syncResults, asyncResults) {
                    jQuery.getJSON(this.LOCATIONS_API + "/" + gaz + "/" + query + "/brief", function (json) {
                        asyncResults(json.data);
                    });
                }, this),
                name: gaz,
                display: jQuery.proxy(function (value) {                    
                    return(value.placename + (this.gazetteerData[gaz].composite ? " (" + value.gazetteer + ")" : ""));
                }, this),
                limit: 100,
                templates: {
                    notFound: '<div class="suggestion-group-header">' + this.gazetteerData[gaz].title + '</div><p class="suggestion">No results</p>',
                    header: '<div class="suggestion-group-header">' + this.gazetteerData[gaz].title + '</div>',
                    suggestion: jQuery.proxy(function (value) {
                        var output = value.placename + (this.gazetteerData[gaz].composite ? " (" + value.gazetteer + ")" : "");                                      
                        this.searchSuggestions[output] = jQuery.extend({}, value, {"__gaz_name": gaz});
                        return('<p class="suggestion">' + output + '</p>');
                    }, this)
                }
            });
        }, this));        
    }, this));        
    
};

/**
 * Set typeahead and search button click handlers 
 */
magic.classes.GazetteerSearchInput.prototype.init = function() {
    jQuery("#" + this.baseId + "-ta").typeahead({minLength: this.minLength, highlight: true}, this.sources)
    .on("typeahead:autocompleted", jQuery.proxy(this.selectHandler, this))
    .on("typeahead:selected", jQuery.proxy(this.selectHandler, this))
    .on("typeahead:render", jQuery.proxy(function () {
        if (jQuery.isFunction(this.suggestionCallbacks.mouseover)) {
            jQuery("p.suggestion").off("mouseover").on("mouseover", {suggestions: this.searchSuggestions}, this.suggestionCallbacks.mouseover);
        }
        if (jQuery.isFunction(this.suggestionCallbacks.mouseout)) {
            jQuery("p.suggestion").off("mouseout").on("mouseout", {suggestions: this.searchSuggestions}, this.suggestionCallbacks.mouseout);
        }            
    }, this));
    jQuery("#" + this.baseId + "-placename-go").click(this.suggestionCallbacks.search);
};

/**
 * Handler for an autocompleted selection of place-name
 * @param {jQuery.Event} evt
 * @param {Object} sugg
 */
magic.classes.GazetteerSearchInput.prototype.selectHandler = function (evt, sugg) {
    var gaz = "";
    jQuery.each(this.searchSuggestions, function (idx, s) {
        if (s.id == sugg.id) {
            gaz = s["__gaz_name"];
            return(false);
        }
    });
    var data = jQuery.extend({}, sugg, {"__gaz_name": gaz});
    this.currentSearch = data;
    if (jQuery.isFunction(this.suggestionCallbacks.select)) {
        this.suggestionCallbacks.select(evt, {suggestions: this.searchSuggestions});
    }
};

magic.classes.GazetteerSearchInput.prototype.getSelection = function() {
    return(this.currentSearch);
};

magic.classes.GazetteerSearchInput.prototype.getSearch = function(value) {
    return(jQuery("#" + this.baseId + "-ta").val());
};

magic.classes.GazetteerSearchInput.prototype.setSearch = function(value) {
    jQuery("#" + this.baseId + "-ta").val(value);
};

magic.classes.GazetteerSearchInput.prototype.markup = function() {
    return(
        '<div class="form-group form-group-sm">' +
            '<div class="input-group">' +
                '<input id="' + this.baseId + '-ta" class="form-control typeahead border-lh-round" type="text" placeholder="Search for place-name" ' +
                    'required="required" autofocus="true"></input>' +
                '<span class="input-group-btn">' +
                    '<button id="' + this.baseId + '-placename-go" class="btn btn-primary btn-sm" type="button" ' +
                        'data-toggle="tooltip" data-placement="right" title="Search gazetteer">' +
                        '<span class="glyphicon glyphicon-search"></span>' +
                    '</button>' +
                '</span>' +
            '</div>' +
        '</div>' 
    );
};

/**
 * Returns the attribution HTML for all gazetteers used in this application
 * @returns {string}
 */
magic.classes.GazetteerSearchInput.prototype.getAttributions = function () {
    var attrArr = jQuery.map(this.gazetteers, jQuery.proxy(function (gaz) {
        return(
                '<strong>' + this.gazetteerData[gaz].title + '</strong>' +
                '<p style="font-size:smaller">' + magic.modules.Common.linkify(this.gazetteerData[gaz].attribution + '. ' + this.gazetteerData[gaz].website) + '</p>'
                );
    }, this));
    return(attrArr.join(""));
};


