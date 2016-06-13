/* Load jQuery if not already */
if (typeof jQuery == "undefined") {
    console.log("Could not find jQuery, so loading it...")
    document.write('<script src="js/jquery.js"><\/script>');
    console.log("Loading complete");
} else {
    console.log("jQuery is present")
}