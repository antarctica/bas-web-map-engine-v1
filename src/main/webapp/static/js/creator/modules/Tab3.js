/* Map Creator tab1 logic */

magic.modules.creator.Tab3 = function () {

    return({
                
       init: function() {           
       },
       /**
        * Load form inputs from data object
        * @param {object} context
        */
       loadContext: function(context) {
            var controls = context.data.controls;
            if ($.isArray(controls)) {
                $.each(controls, function(idx, c) {
                    var formControl = $("#t3-form input[type='checkbox'][value='" + c + "']");
                    if (formControl.length > 0) {
                        /* This control has a checkbox that needs to reflect its state */
                        formControl.prop("checked", true);
                    }
                });     
            }
            /* Security inputs */
            $("select[name='t3-allowed_usage']").val(context.allowed_usage);
            $("select[name='t3-allowed_download']").val(context.allowed_download);
        },
        /**
        * Load data object from form inputs
        * @param {object} context
        */
        saveContext: function(context) {
            var controls = [];
            var formControls = $("input[name='t3-controls']");
            if ($.isArray(formControls)) {
                $.each(formControls, function(idx, f) {
                    if (f.attr("type") != "checkbox" || (f.attr("type") == "checkbox" && f.prop("checked") === true)) {
                        controls.push(f.val());
                    }
                });
                context.data.controls = controls;
            }
            /* Security inputs */
            context.allowed_usage = $("select[name='t3-allowed_usage']").val();
            context.allowed_download = $("select[name='t3-allowed_download']").val();
        }

    });

}();