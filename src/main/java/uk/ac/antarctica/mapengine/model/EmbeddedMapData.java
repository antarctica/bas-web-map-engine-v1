/*
 * Embedded web maps bean
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.util.UUID;

public class EmbeddedMapData extends AbstractMapData {
    
    /* Specific fields */   
    private String center = "";
    private int zoom = 0;
    private double rotation = 0.0;
    private String projection = "";    
    private String proj_extent = ""; 
    private String data_extent = "";
    private String resolutions = ""; 
    private String layers = "";
    
    public EmbeddedMapData(String tableName) {
        super(tableName);                
    }        

    @Override
    public void fromPayload(String payload, String username) {
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        setId((String)getJsonElement(jo, "id", false, UUID.randomUUID().toString()));
        setName((String)getJsonElement(jo, "name", false, "new_map"));        
        setTitle((String)getJsonElement(jo, "title", false, "Map title"));        
        setDescription((String)getJsonElement(jo, "description", true, null));                
        setOwner_name(username);           
        setOwner_email((String)getJsonElement(jo, "owner_email", false, "basmagic@bas.ac.uk"));        
        setCenter((String)getJsonElement(jo, "center", false, "0,0"));
        setZoom((int)getJsonElement(jo, "zoom", false, 0, Integer.class));
        setRotation((double)getJsonElement(jo, "rotation", false, 0.0, Double.class));
        setProjection((String)getJsonElement(jo, "projection", false, "EPSG:4326"));
        setProj_extent((String)getJsonElement(jo, "proj_extent", false, "-180.0,-90.0,180.0,90.0"));
        setData_extent((String)getJsonElement(jo, "data_extent", false, ""));
        setResolutions((String)getJsonElement(jo, "resolutions", false, ""));
        setLayers((String)getJsonElement(jo, "layers", false, "[]"));        
        setAllowed_usage((String)getJsonElement(jo, "allowed_usage", false, "public"));        
        setAllowed_edit((String)getJsonElement(jo, "allowed_edit", false, "login"));       
    }

    @Override
    public String insertSql() {
        return("INSERT INTO " + getTableName() + " VALUES(?,?,?,?,current_timestamp,current_timestamp,?,?,?,?,?,?,?,?,?,?,?,?)");
    }

    @Override
    public Object[] insertArgs() {        
        return(new Object[] {
            getId(),
            getName(),
            getTitle(),
            getDescription(),                       
            getOwner_name(),
            getOwner_email(),            
            getCenter(),
            getZoom(),
            getRotation(),
            getProjection(),
            getProj_extent(),
            getData_extent(),
            getResolutions(),
            getJsonDataAsPgObject(getLayers()),
            getAllowed_usage(),
            getAllowed_edit()                               
        });
    }

    @Override
    public String updateSql() {
        return("UPDATE " + getTableName() + " SET " + 
            "name=?, " + 
            "title=?, " +
            "description=?, " +             
            "modified_date=current_timestamp, " + 
            "owner_email=?, " +             
            "center=?, " + 
            "zoom=?, " + 
            "rotation=?, " + 
            "projection=?, " +
            "proj_extent=?, " +
            "data_extent=?, " +
            "resolutions=?, " +
            "layers=?, " + 
            "allowed_usage=?, " +
            "allowed_edit=? " +             
            "WHERE id=?"
        );
    }

    @Override
    public Object[] updateArgs(Object id) {
        return(new Object[] {
            getName(),
            getTitle(),
            getDescription(),            
            getOwner_email(),            
            getCenter(),
            getZoom(),
            getRotation(),
            getProjection(),
            getProj_extent(),
            getData_extent(),
            getResolutions(),
            getJsonDataAsPgObject(getLayers()),
            getAllowed_usage(),
            getAllowed_edit(),            
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

    public String getCenter() {
        return center;
    }

    public void setCenter(String center) {
        this.center = center;
    }

    public int getZoom() {
        return zoom;
    }

    public void setZoom(int zoom) {
        this.zoom = zoom;
    }

    public double getRotation() {
        return rotation;
    }

    public void setRotation(double rotation) {
        this.rotation = rotation;
    }

    public String getProjection() {
        return projection;
    }

    public void setProjection(String projection) {
        this.projection = projection;
    }

    public String getProj_extent() {
        return proj_extent;
    }

    public void setProj_extent(String proj_extent) {
        this.proj_extent = proj_extent;
    }

    public String getResolutions() {
        return resolutions;
    }

    public void setResolutions(String resolutions) {
        this.resolutions = resolutions;
    }

    public String getLayers() {
        return layers;
    }

    public void setLayers(String layers) {
        this.layers = layers;
    }

    public String getData_extent() {
        return data_extent;
    }

    public void setData_extent(String data_extent) {
        this.data_extent = data_extent;
    }
    
}
