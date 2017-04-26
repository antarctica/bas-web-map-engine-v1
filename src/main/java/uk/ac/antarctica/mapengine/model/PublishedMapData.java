/*
 * Published web maps bean
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.util.Date;
import java.util.UUID;

public class PublishedMapData extends AbstractMapData {
    
    /* Specific fields */
    private String version = "";
    private String logo = "";
    private String favicon = "";
    private String repository = "";
    private String metadata_url = "";    
    private String allowed_download = "";
    private String infolink = "";
    private String newslink = "";
    private String watermark = "";
    
    public PublishedMapData(String tableName, String userTableName) {
        super(tableName, userTableName);
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
        setVersion(jo.get("version").getAsString());
        setLogo(jo.get("logo").getAsString());
        /* The following properties are not currently modifiable through the GUI */
        setFavicon("bas.ico");
        /* End of non-modifiable properties */
        setRepository(jo.get("repository").getAsString());
        setCreation_date(now);
        setModified_date(now);
        setOwner_name(username);           
        setOwner_email(jo.get("owner_email").getAsString());
        setMetadata_url(jo.get("metadata_url").getAsString());
        setData(jo.get("data").toString());
        setAllowed_usage(jo.get("allowed_usage").getAsString());        
        setAllowed_download(jo.get("allowed_download").getAsString());
        setAllowed_edit(jo.get("allowed_edit").getAsString());
        setInfolink(jo.get("infolink").getAsString());
        setNewslink(jo.get("newslink").getAsString());
        setWatermark(jo.get("watermark").getAsString());
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
            getVersion(),
            getLogo(),
            getFavicon(),
            getRepository(),
            getCreation_date(),
            getModified_date(),
            getOwner_name(),
            getOwner_email(),
            getMetadata_url(),
            getDataAsPgObject(),
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
            "modified_date=?, " + 
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
    public Object[] updateArgs(String id) {
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
            getModified_date(),       
            getOwner_email(),
            getMetadata_url(),
            getDataAsPgObject(),
            getAllowed_usage(),
            getAllowed_download(),
            getAllowed_edit(),
            getInfolink(),
            getNewslink(),
            getWatermark(),
            id
        });
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
    
}
