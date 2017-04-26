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
    private int width;
    private int height;
    private String embed;
    private String center;
    private int zoom;
    private double rotation;
    private String projection;    
    
    public EmbeddedMapData(String tableName) {
        super(tableName, null);
    }

    @Override
    public void fromPayload(String payload, String username) {
        Date now = new Date();
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        setId(jo.has("id") ? jo.get("id").getAsString() : UUID.randomUUID().toString());
        setName(jo.get("name").getAsString());
        setTitle(jo.get("title").getAsString());
        setDescription(jo.get("description").getAsString());        
        setCreation_date(now);
        setModified_date(now);
        setOwner_name(username);           
        setOwner_email(jo.get("owner_email").getAsString());
        setWidth(jo.get("width").getAsInt());
        setHeight(jo.get("height").getAsInt());
        setEmbed(jo.get("embed").getAsString());
        setCenter(jo.get("center").getAsString());
        setZoom(jo.get("zoom").getAsInt());
        setRotation(jo.get("rotation").getAsDouble());
        setProjection(jo.get("projection").getAsString());
        setData(jo.get("data").toString());
        setAllowed_usage(jo.get("allowed_usage").getAsString());        
        setAllowed_edit(jo.get("allowed_edit").getAsString());        
    }

    @Override
    public String insertSql() {
        return("INSERT INTO " + getTableName() + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
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
            getDataAsPgObject(),
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
            "data=?, " + 
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
            getDataAsPgObject(),
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
    
}
