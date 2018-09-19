/*
 * Captures map plugin data
 */
package uk.ac.antarctica.mapengine.model;

public class MapPlugin {
    
    private String name;
    private String allowed_usage;
    private String caption;
    private String tooltip;
    private String iconclass;
    private String js_filename;
    private String ext_css;
    private String ext_js;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAllowed_usage() {
        return allowed_usage;
    }

    public void setAllowed_usage(String allowed_usage) {
        this.allowed_usage = allowed_usage;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public String getTooltip() {
        return tooltip;
    }

    public void setTooltip(String tooltip) {
        this.tooltip = tooltip;
    }

    public String getIconclass() {
        return iconclass;
    }

    public void setIconclass(String iconclass) {
        this.iconclass = iconclass;
    }

    public String getJs_filename() {
        return js_filename;
    }

    public void setJs_filename(String js_filename) {
        this.js_filename = js_filename;
    }

    public String getExt_css() {
        return ext_css;
    }

    public void setExt_css(String ext_css) {
        this.ext_css = ext_css;
    }

    public String getExt_js() {
        return ext_js;
    }

    public void setExt_js(String ext_js) {
        this.ext_js = ext_js;
    }
    
}
