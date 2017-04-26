/*
 * Embedded web maps bean
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.util.Date;
import java.util.UUID;

public class EmbeddedMapData extends AbstractMapData {
    
    /* Specific fields */
    private int width = 0;
    private int height = 0;
    private String embed = "";
    private String center = "";
    private int zoom = 0;
    private double rotation = 0.0;
    private String projection = "";    
    private String proj_extent = ""; 
    private String resolutions = ""; 
    private String layers = "";
    
    public EmbeddedMapData(String tableName) {
        super(tableName, null);
    }

    @Override
    public void fromPayload(String payload, String username) {
        Date now = new Date();
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        setId((String)getJsonElement(jo, "id", false, UUID.randomUUID().toString()));
        setName((String)getJsonElement(jo, "name", false, "new_map"));        
        setTitle((String)getJsonElement(jo, "title", false, "Map title"));        
        setDescription((String)getJsonElement(jo, "description", true, null));        
        setCreation_date(now);
        setModified_date(now);
        setOwner_name(username);           
        setOwner_email((String)getJsonElement(jo, "owner_email", false, "basmagic@bas.ac.uk"));
        setWidth((int)getJsonElement(jo, "width", false, 400, Integer.class));
        setHeight((int)getJsonElement(jo, "height", false, 300, Integer.class));        
        setEmbed((String)getJsonElement(jo, "embed", false, "map"));
        setCenter((String)getJsonElement(jo, "center", false, "[0,0]"));
        setZoom((int)getJsonElement(jo, "zoom", false, 0, Integer.class));
        setRotation((double)getJsonElement(jo, "rotation", false, 0.0, Double.class));
        setProjection((String)getJsonElement(jo, "projection", false, "EPSG:4326"));
        setProj_extent((String)getJsonElement(jo, "proj_extent", false, "[-180.0,-90.0,180.0,90.0]"));
        setResolutions((String)getJsonElement(jo, "resolutions", false, "[]"));
        setLayers((String)getJsonElement(jo, "layers", false, "[]"));
        setAllowed_usage((String)getJsonElement(jo, "allowed_usage", false, "public"));        
        setAllowed_edit((String)getJsonElement(jo, "allowed_edit", false, "login"));       
    }

    @Override
    public String insertSql() {
        return("INSERT INTO " + getTableName() + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    }

    @Override
    public Object[] insertArgs() {        
        return(new Object[] {
            getId(),
            getName(),
            getTitle(),
            getDescription(),            
            getCreation_date(),
            getModified_date(),
            getOwner_name(),
            getOwner_email(),
            getWidth(),
            getHeight(),
            getEmbed(),
            getCenter(),
            getZoom(),
            getRotation(),
            getProjection(),
            getProj_extent(),
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
            "modified_date=?, " + 
            "owner_email=?, " + 
            "width=?, " + 
            "height=?, " + 
            "embed=?, " + 
            "center=?, " + 
            "zoom=?, " + 
            "rotation=?, " + 
            "projection=?, " +
            "proj_extent=?, " +
            "resolutions=?, " +
            "layers=?, " + 
            "allowed_usage=?, " +
            "allowed_edit=?, " +             
            "WHERE id=?"
        );
    }

    @Override
    public Object[] updateArgs(String id) {
        return(new Object[] {
            getName(),
            getTitle(),
            getDescription(),            
            getModified_date(),       
            getOwner_email(),
            getWidth(),
            getHeight(),
            getEmbed(),
            getCenter(),
            getZoom(),
            getRotation(),
            getProjection(),
            getProj_extent(),
            getResolutions(),
            getJsonDataAsPgObject(getLayers()),
            getAllowed_usage(),
            getAllowed_edit(),            
            id
        });
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public String getEmbed() {
        return embed;
    }

    public void setEmbed(String embed) {
        this.embed = embed;
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
    
}
