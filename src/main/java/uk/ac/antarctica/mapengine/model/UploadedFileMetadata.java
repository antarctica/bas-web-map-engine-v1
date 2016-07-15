/*
 * Metadata bean for uploaded files
 */
package uk.ac.antarctica.mapengine.model;

import java.io.File;

public class UploadedFileMetadata {

    private String name;
    private String title;
    private String description;
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

}
