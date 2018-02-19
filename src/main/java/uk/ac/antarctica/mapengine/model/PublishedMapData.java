/*
 * Published web maps bean
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import java.util.UUID;

public class PublishedMapData extends AbstractMapData {
    
    /* Specific fields */
    private String version = "";
    private String logo = "";
    private String favicon = "";
    private String repository = "";
    private String metadata_url = ""; 
    private String data = "";
    private String allowed_download = "";
    private String infolink = "";
    private String newslink = "";
    private String watermark = "";
        
    public PublishedMapData(String tableName) {
        super(tableName);
    }
    
    public PublishedMapData(String tableName, String userTableName) {
        super(tableName, userTableName);
    }
    
    public PublishedMapData(String tableName, String userTableName, String userLayerTableName) {
        super(tableName, userTableName, userLayerTableName);
    }

    @Override
    public void fromPayload(String payload, String username) {
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        setId((String)getJsonElement(jo, "id", false, UUID.randomUUID().toString()));
        setName((String)getJsonElement(jo, "name", false, "new_map"));        
        setTitle((String)getJsonElement(jo, "title", false, "Map title"));        
        setDescription((String)getJsonElement(jo, "description", true, null));
        setVersion((String)getJsonElement(jo, "version", false, "1.0"));
        setLogo((String)getJsonElement(jo, "logo", true, null));
        /* The following properties are not currently modifiable through the GUI */
        setFavicon("bas.ico");
        /* End of non-modifiable properties */
        setRepository((String)getJsonElement(jo, "repository", true, null));        
        setOwner_name(username);           
        setOwner_email((String)getJsonElement(jo, "owner_email", false, "basmagic@bas.ac.uk"));
        setMetadata_url((String)getJsonElement(jo, "metadata_url", true, null));
        setData((String)getJsonElement(jo, "data", false, "{}"));
        setAllowed_usage((String)getJsonElement(jo, "allowed_usage", false, "public"));        
        setAllowed_download((String)getJsonElement(jo, "allowed_download", false, "login"));
        setAllowed_edit((String)getJsonElement(jo, "allowed_edit", false, "login"));
        setInfolink((String)getJsonElement(jo, "infolink", true, null));
        setNewslink((String)getJsonElement(jo, "newslink", true, null));
        setWatermark((String)getJsonElement(jo, "watermark", true, null));
    }

    @Override
    public String insertSql() {
        return("INSERT INTO " + getTableName() + " VALUES(?,?,?,?,?,?,?,?,current_timestamp,current_timestamp,?,?,?,?,?,?,?,?,?,?)");
    }

    @Override
    public Object[] insertArgs() {        
        return(new Object[] {
            getId(),
            getName(),
            getTitle(),
            getDescription(),
            getVersion(),
            getLogo(),
            getFavicon(),
            getRepository(),            
            getOwner_name(),
            getOwner_email(),
            getMetadata_url(),
            getJsonDataAsPgObject(getData()),
            getAllowed_usage(),
            getAllowed_download(),
            getAllowed_edit(),
            getInfolink(),
            getNewslink(),
            getWatermark()                    
        });
    }

    @Override
    public String updateSql() {
        return("UPDATE " + getTableName() + " SET " + 
            "name=?, " + 
            "title=?, " +
            "description=?, " + 
            "version=?, " + 
            "logo=?, " + 
            "favicon=?, " + 
            "repository=?, " +
            "modified_date=current_timestamp, " + 
            "owner_email=?, " + 
            "metadata_url=?, " + 
            "data=?, " + 
            "allowed_usage=?, " +
            "allowed_download=?, " +
            "allowed_edit=?, " + 
            "infolink=?, " + 
            "newslink=?, " + 
            "watermark=? " + 
            "WHERE id=?"
        );
    }

    @Override
    public Object[] updateArgs(Object id) {
        return(new Object[] {
            getName(),
            getTitle(),
            getDescription(),
            getVersion(),
            getLogo(),
            /* The following properties are not currently modifiable through the GUI */
            "bas.ico",
            /* End of non-modifiable properties */
            getRepository(),
            getOwner_email(),
            getMetadata_url(),
            getJsonDataAsPgObject(getData()),
            getAllowed_usage(),
            getAllowed_download(),
            getAllowed_edit(),
            getInfolink(),
            getNewslink(),
            getWatermark(),
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

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getLogo() {
        return logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public String getFavicon() {
        return favicon;
    }

    public void setFavicon(String favicon) {
        this.favicon = favicon;
    }

    public String getRepository() {
        return repository;
    }

    public void setRepository(String repository) {
        this.repository = repository;
    }

    public String getMetadata_url() {
        return metadata_url;
    }

    public void setMetadata_url(String metadata_url) {
        this.metadata_url = metadata_url;
    }

    public String getAllowed_download() {
        return allowed_download;
    }

    public void setAllowed_download(String allowed_download) {
        this.allowed_download = allowed_download;
    }

    public String getInfolink() {
        return infolink;
    }

    public void setInfolink(String infolink) {
        this.infolink = infolink;
    }

    public String getNewslink() {
        return newslink;
    }

    public void setNewslink(String newslink) {
        this.newslink = newslink;
    }

    public String getWatermark() {
        return watermark;
    }

    public void setWatermark(String watermark) {
        this.watermark = watermark;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }    
    
}
