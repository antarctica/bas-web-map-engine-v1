/*
 * User web map view bean
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;

public class UserMapData extends AbstractMapData {
    
    /* Specific fields */
    private String basemap = "";   
    private String data = "";
    
    public UserMapData(String tableName) {
        super(tableName);
    }
   
    @Override
    public void fromPayload(String payload, String username) {
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        setId((String)getJsonElement(jo, "id", false, ""));
        setName((String)getJsonElement(jo, "name", false, ""));        
        setTitle("");        
        setDescription("");               
        setOwner_name(username);           
        setOwner_email("");
        setAllowed_usage((String)getJsonElement(jo, "allowed_usage", false, "public"));
        setAllowed_edit("owner");
        setBasemap((String)getJsonElement(jo, "basemap", true, null));
        setData((String)getJsonElement(jo, "data", false, "{}"));        
    }

    @Override
    public String insertSql() {
        return(
            "INSERT INTO " + getTableName() + " " + 
            "(name, title, description, creation_date, modified_date, owner_name, owner_email, allowed_usage, allowed_edit, basemap, data) " + 
            "VALUES(?,?,?, current_timestamp,current_timestamp,?,?,?,?,?,?)"
        );
    }
    
    @Override
    public Object[] insertArgs() {        
        return(new Object[] {
            getName(),
            getTitle(),
            getDescription(),                       
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
            "modified_date=current_timestamp, " + 
            "allowed_usage=?, " +
            "basemap=?, " +
            "data=? " +              
            "WHERE id=?"
        );
    }

    @Override
    public Object[] updateArgs(Object id) {
        return(new Object[] {
            getName(),               
            getAllowed_usage(),
            getBasemap(),
            getJsonDataAsPgObject(getData()),
            id
        });
    }
    
    @Override
    public String deleteSql() {
        return("DELETE FROM " + getTableName() + " WHERE id=?");
    }
    
    @Override
    public Object[] deleteArgs(Object id) {
        return(new Object[] {
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
