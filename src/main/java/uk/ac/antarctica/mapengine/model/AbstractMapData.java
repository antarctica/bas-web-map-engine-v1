/*
 * Generic web map data bean
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import java.sql.SQLException;
import java.util.Date;
import org.postgresql.util.PGobject;

public abstract class AbstractMapData {
    
    /* Generic fields from all webmap.x tables */
    private String id = "";
    private String name = "";
    private String title = "";
    private String description = ""; 
    private Date creation_date = null;
    private Date modified_date = null;
    private String owner_name = "";
    private String owner_email = "";
    private String allowed_usage = "";
    private String allowed_edit = "";
    
    /* Corresponding table containing map data */
    private String tableName;
    
    /* Table containing user-variants on published maps */
    private String userTableName;
    
    /* Table containing user-uploaded layers */
    private String userLayerTableName;
    
    public AbstractMapData(String tableName) {        
        this.tableName = tableName;
        this.userTableName = null;
    }
    
    public AbstractMapData(String tableName, String userTableName) {        
        this.tableName = tableName;
        this.userTableName = userTableName;
    }
    
    public AbstractMapData(String tableName, String userTableName, String userLayerTableName) {        
        this.tableName = tableName;
        this.userTableName = userTableName;
        this.userLayerTableName = userLayerTableName;
    }
    
    public abstract void fromPayload(String payload, String username);
    
    public abstract String insertSql();
    
    public abstract Object[] insertArgs();
    
    public abstract String updateSql();
    
    public abstract Object[] updateArgs(String id); 
    
    public abstract String deleteSql();
    
    public abstract Object[] deleteArgs(String id);    
    
    public Object getJsonElement(JsonObject jo, String key, boolean allowEmpty, Object defaultValue) {
        return(getJsonElement(jo, key, allowEmpty, defaultValue, String.class));
    }
    
    public Object getJsonElement(JsonObject jo, String key, boolean allowEmpty, Object defaultValue, Class clazz) {
        Object elt = null;
        if (jo != null && jo.has(key)) {
            JsonElement je = jo.get(key);
            if (je.isJsonArray()) {
                JsonArray ja = je.getAsJsonArray();
                if (ja.size() == 0 && !allowEmpty && defaultValue != null) {
                    elt = defaultValue;
                } else {
                    elt = ja.toString();
                }
            } else if (je.isJsonObject()) {
                JsonObject jb = je.getAsJsonObject();
                if (jb.entrySet().isEmpty() && !allowEmpty && defaultValue != null) {
                    elt = defaultValue;
                } else {
                    elt = jb.toString();
                }
            } else if (je.isJsonPrimitive()) {
                JsonPrimitive jp = je.getAsJsonPrimitive();
                if (jp.isString()) {
                    if (jp.getAsString().equals("") && !allowEmpty && defaultValue != null) {
                        elt = defaultValue;
                    } else {
                        elt = jp.getAsString();
                    }
                } else if (jp.isNumber()) {
                    if (clazz == Integer.class) {
                        elt = jp.getAsInt();
                    } else if (clazz == Double.class) {
                        elt = jp.getAsDouble();
                    }
                }
            } else if (!allowEmpty) {
                elt = defaultValue;
            }        
        }
        return(elt);
    }
    
    public PGobject getJsonDataAsPgObject(String value) {
        /* A bit of "cargo-cult" programming from https://github.com/denishpatel/java/blob/master/PgJSONExample.java - what a palaver! */
        PGobject dataObject = new PGobject();
        dataObject.setType("json");
        try {
            dataObject.setValue(value);
        } catch (SQLException ex) {            
        }
        return(dataObject);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Date getCreation_date() {
        return creation_date;
    }

    public void setCreation_date(Date creation_date) {
        this.creation_date = creation_date;
    }

    public Date getModified_date() {
        return modified_date;
    }

    public void setModified_date(Date modified_date) {
        this.modified_date = modified_date;
    }

    public String getOwner_name() {
        return owner_name;
    }

    public void setOwner_name(String owner_name) {
        this.owner_name = owner_name;
    }

    public String getOwner_email() {
        return owner_email;
    }

    public void setOwner_email(String owner_email) {
        this.owner_email = owner_email;
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public String getUserTableName() {
        return userTableName;
    }

    public void setUserTableName(String userTableName) {
        this.userTableName = userTableName;
    }

    public String getAllowed_usage() {
        return allowed_usage;
    }

    public void setAllowed_usage(String allowed_usage) {
        this.allowed_usage = allowed_usage;
    }

    public String getAllowed_edit() {
        return allowed_edit;
    }

    public void setAllowed_edit(String allowed_edit) {
        this.allowed_edit = allowed_edit;
    }
    
    public String getUserLayerTableName() {
        return userLayerTableName;
    }

    public void setUserLayerTableName(String userLayerTableName) {
        this.userLayerTableName = userLayerTableName;
    }        
    
}
