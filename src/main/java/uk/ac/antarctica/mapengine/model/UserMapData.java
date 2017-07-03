/*
 * User web map view bean
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.util.Date;
import java.util.UUID;

public class UserMapData extends AbstractMapData {
    
    /* Specific fields */
    private String basemap = "";   
    private String data = "";
    
    public UserMapData(String tableName, String userTableName) {
        super(tableName, userTableName);
    }

    @Override
    public void fromPayload(String payload, String username) {
        Date now = new Date();
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        setId((String)getJsonElement(jo, "id", false, UUID.randomUUID().toString()));
        setName((String)getJsonElement(jo, "name", false, ""));        
        setTitle("");        
        setDescription("");       
        setCreation_date(now);
        setModified_date(now);
        setOwner_name(username);           
        setOwner_email("");
        setAllowed_usage((String)getJsonElement(jo, "allowed_usage", false, "public"));
        setAllowed_edit("owner");
        setBasemap((String)getJsonElement(jo, "basemap", true, null));
        setData((String)getJsonElement(jo, "data", false, "{}"));        
    }

    @Override
    public String insertSql() {
        return("INSERT INTO " + getTableName() + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?)");
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
            getAllowed_usage(),
            getAllowed_edit(), 
            getBasemap(),
            getJsonDataAsPgObject(getData())                                  
        });
    }

    @Override
    public String updateSql() {
        return("UPDATE " + getTableName() + " SET " + 
            "name=?, " +            
            "modified_date=?, " + 
            "allowed_usage=?, " +
            "basemap=?, " +
            "data=? " +              
            "WHERE id=?"
        );
    }

    @Override
    public Object[] updateArgs(String id) {
        return(new Object[] {
            getName(),               
            getModified_date(),       
            getAllowed_usage(),
            getBasemap(),
            getJsonDataAsPgObject(getData()),
            id
        });
    }

    public String getBasemap() {
        return basemap;
    }

    public void setBasemap(String watermark) {
        this.basemap = watermark;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
    
}
