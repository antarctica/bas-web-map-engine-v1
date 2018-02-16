/*
 * Models a WMS endpoint service
 */
package uk.ac.antarctica.mapengine.model;

import org.hibernate.validator.constraints.NotEmpty;

public class EndpointData {
    
    @NotEmpty
    private String name;
    @NotEmpty
	private String url;
    @NotEmpty
    private String location;
    private boolean low_bandwidth;
    private String coast_layers;
    private String graticule_layer;
    private String proxied_url;
    @NotEmpty
    private String srs;
    private boolean has_wfs;
    private boolean is_user_service;
    private String url_aliases;
    private String rest_endpoint;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public boolean isLow_bandwidth() {
        return low_bandwidth;
    }

    public void setLow_bandwidth(boolean low_bandwidth) {
        this.low_bandwidth = low_bandwidth;
    }

    public String getCoast_layers() {
        return coast_layers;
    }

    public void setCoast_layers(String coast_layers) {
        this.coast_layers = coast_layers;
    }

    public String getGraticule_layer() {
        return graticule_layer;
    }

    public void setGraticule_layer(String graticule_layer) {
        this.graticule_layer = graticule_layer;
    }

    public String getProxied_url() {
        return proxied_url;
    }

    public void setProxied_url(String proxied_url) {
        this.proxied_url = proxied_url;
    }

    public String getSrs() {
        return srs;
    }

    public void setSrs(String srs) {
        this.srs = srs;
    }

    public boolean isHas_wfs() {
        return has_wfs;
    }

    public void setHas_wfs(boolean has_wfs) {
        this.has_wfs = has_wfs;
    }

    public boolean isIs_user_service() {
        return is_user_service;
    }

    public void setIs_user_service(boolean is_user_service) {
        this.is_user_service = is_user_service;
    }

    public String getUrl_aliases() {
        return url_aliases;
    }

    public void setUrl_aliases(String url_aliases) {
        this.url_aliases = url_aliases;
    }

    public String getRest_endpoint() {
        return rest_endpoint;
    }

    public void setRest_endpoint(String rest_endpoint) {
        this.rest_endpoint = rest_endpoint;
    }
            
}
