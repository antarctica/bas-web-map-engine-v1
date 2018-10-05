/*
 * JSON payload base class
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import java.sql.SQLException;
import org.postgresql.util.PGobject;

public abstract class JsonCrudApp {
        
    public abstract void fromPayload(String payload, String username);
    
    public abstract String insertSql();
    
    public abstract Object[] insertArgs();
    
    public abstract String updateSql();
    
    public abstract Object[] updateArgs(Object id); 
    
    public abstract String deleteSql();
    
    public abstract Object[] deleteArgs(Object id);    
    
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
                    } else if (clazz == Integer.class) {
                        elt = jp.getAsInt();
                    } else if (clazz == Double.class) {
                        elt = jp.getAsDouble();
                    } else {                        
                        elt = jp.getAsString();
                    }
                } else if (jp.isNumber()) {
                    if (clazz == Integer.class) {
                        elt = jp.getAsInt();
                    } else if (clazz == Double.class) {
                        elt = jp.getAsDouble();
                    }
                } else if (jp.isBoolean()) {
                    elt = jp.getAsBoolean();
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
            System.out.println("Problem preparing JSON value for PostGIS ingestion : " + ex.getMessage());
        }
        return(dataObject);
    }
    
}
