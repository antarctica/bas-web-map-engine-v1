/*
 * Metadata bean for uploaded files
 */
package uk.ac.antarctica.mapengine.model;

import java.io.File;

public class UploadedFileMetadata {

    private String uuid;
    private String name;
    private String title;
    private String description;
    private String allowed_usage;
    private String styledef;
    private String srs;
    private File uploaded;

    public UploadedFileMetadata() {
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

    public String getSrs() {
        return srs;
    }

    public void setSrs(String srs) {
        this.srs = srs;
    }

    public File getUploaded() {
        return uploaded;
    }
    
    public void setUploaded(File uploaded) {
        this.uploaded = uploaded;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getAllowed_usage() {
        return allowed_usage;
    }

    public void setAllowed_usage(String allowed_usage) {
        this.allowed_usage = allowed_usage;
    }

    public String getStyledef() {
        return styledef;
    }

    public void setStyledef(String styledef) {
        this.styledef = styledef;
    }

}
