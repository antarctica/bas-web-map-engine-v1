/*
 * Wrapper for all upload file data
 */
package uk.ac.antarctica.mapengine.model;

public class UploadedData {
    
    private UploadedFileMetadata ufmd;
    
    private UploadedFileUserEnvironment ufue;

    public UploadedFileMetadata getUfmd() {
        return ufmd;
    }

    public void setUfmd(UploadedFileMetadata ufmd) {
        this.ufmd = ufmd;
    }

    public UploadedFileUserEnvironment getUfue() {
        return ufue;
    }

    public void setUfue(UploadedFileUserEnvironment ufue) {
        this.ufue = ufue;
    }        
    
}
