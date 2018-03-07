/*
 * Models a WMS endpoint service
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class EndpointData extends JsonCrudApp {
    
    private int id;
    private String name;
	private String url;
    private String location;
    private boolean low_bandwidth;
    private String coast_layers;
    private String graticule_layer;
    private String proxied_url;
    private String srs;
    private boolean has_wfs;
    private boolean is_user_service;
    private String url_aliases;
    private String rest_endpoint;
    
    private String tableName;
    
    public EndpointData(String tableName) {
        this.tableName = tableName;
    }
        
    @Override
    public void fromPayload(String payload, String username) {
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        setId((int)getJsonElement(jo, "id", true, 0, Integer.class));
        setName((String)getJsonElement(jo, "name", false, "new_endpoint"));        
        setUrl((String)getJsonElement(jo, "url", false, "http://localhost:8080/geoserver"));        
        setLocation((String)getJsonElement(jo, "location", false, "cambridge"));           
        setLow_bandwidth((boolean)getJsonElement(jo, "low_bandwidth", false, false));
        setCoast_layers((String)getJsonElement(jo, "coast_layers", true, ""));
        setGraticule_layer((String)getJsonElement(jo, "graticule_layer", true, ""));
        setProxied_url((String)getJsonElement(jo, "proxied_url", true, ""));
        setSrs((String)getJsonElement(jo, "srs", false, "EPSG:3031"));    
        setHas_wfs((boolean)getJsonElement(jo, "has_wfs", false, false));
        setIs_user_service((boolean)getJsonElement(jo, "is_user_service", false, false));
        setUrl_aliases((String)getJsonElement(jo, "url_aliases", true, ""));  
        setRest_endpoint((String)getJsonElement(jo, "rest_endpoint", true, ""));          
    }
    
    @Override
    public String insertSql() {
        return("INSERT INTO " + getTableName() + " " + 
            "(name, url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases, rest_endpoint) " + 
            "VALUES(?,?,?,?,?,?,?,?,?,?,?,?)"
        );
    }

    @Override
    public Object[] insertArgs() {
        return(new Object[] {
            getName(),
            getUrl(),
            getLocation(),
            isLow_bandwidth(),
            getCoast_layers(),
            getGraticule_layer(),
            getProxied_url(),
            getSrs(),
            isHas_wfs(),
            isIs_user_service(),
            getUrl_aliases(),
            getRest_endpoint()              
        });
    }

    @Override
    public String updateSql() {
        return("UPDATE " + getTableName() + " SET " + 
            "name=?, " + 
            "url=?, " +
            "location=?, " +             
            "low_bandwidth=?, " +             
            "coast_layers=?, " + 
            "graticule_layer=?, " + 
            "proxied_url=?, " + 
            "srs=?, " +
            "has_wfs=?, " +
            "is_user_service=?, " +
            "url_aliases=?, " +
            "rest_endpoint=? " +             
            "WHERE id=?"
        );
    }

    @Override
    public Object[] updateArgs(Object id) {
        return(new Object[] {
            getName(),
            getUrl(),
            getLocation(),
            isLow_bandwidth(),
            getCoast_layers(),
            getGraticule_layer(),
            getProxied_url(),
            getSrs(),
            isHas_wfs(),
            isIs_user_service(),
            getUrl_aliases(),
            getRest_endpoint(),
            id
        });
    }

    @Override
    public String deleteSql() {
        return("DELETE FROM " + getTableName() + " WHERE id=?");
    }

    @Override
    public Object[] deleteArgs(Object id) {
        return(new Object[] {id});
    }
    
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }    

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

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }
            
}
