/* Dashboard of Field Party positions (BLIP) as a Bootstrap popover */

magic.classes.FieldPartyPositionButton = function (options) {
    
    /* ICAO Phonetic Aphabet (English spellings) */
    this.PHONETIC_ALPHABET = [
        "Alpha", "Bravo", "Charlie", "Delta", 
        "Echo", "Foxtrot", "Golf", "Hotel", 
        "India", "Juliett", "Kilo", "Lima", 
        "Mike", "November", "Oscar", "Papa", 
        "Quebec", "Romeo", "Sierra", "Tango", 
        "Uniform", "Victor", "Whiskey", "X-ray", 
        "Yankee", "Zulu"  
    ];
    
    /* How many buttons we want in each row */
    this.BUTTONS_PER_ROW = 4;
   
    magic.classes.NavigationBarTool.call(this, options);
    
    
    /* Control callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(function() {
            //TODO
            }, this),
        onDeactivate: jQuery.proxy(function() {
            //TODO
            }, this), 
        onMinimise: jQuery.proxy(this.saveState, this)
    });
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate();
        if (this.isActive() && !jQuery.isEmptyObject(this.savedSearch)) {
            this.restoreState();
        }               
    }, this));    
};

magic.classes.FieldPartyPositionButton.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.FieldPartyPositionButton.prototype.constructor = magic.classes.FieldPartyPositionButton;

magic.classes.FieldPartyPositionButton.prototype.markup = function() {
    var markup = "";
    var nRows = Math.ceil(this.PHONETIC_ALHPABET.length/this.BUTTONS_PER_ROW);
    for (var i = 0; i < nRows; i++) {
        markup = markup + '<ul class="nav nav-pills">';
        var btnIndex = i*this.BUTTONS_PER_ROW;
        for (var j = 0; btnIndex+j < this.PHONETIC_ALPHABET.length && j < this.BUTTONS_PER_ROW; j++) {
            markup = markup + '<li role="presentation"><a href="#" role="button" class="btn btn-default">' + this.PHONETIC_ALHPABET[btnIndex+j] + '</a></li>';
        }
        markup = markup + '</ul>';
    }
    return(markup);
};


magic.classes.FieldPartyPositionButton.prototype.saveState = function() {
    //TODO
};

magic.classes.FieldPartyPositionButton.prototype.restoreState = function() {
    //TODO
};
