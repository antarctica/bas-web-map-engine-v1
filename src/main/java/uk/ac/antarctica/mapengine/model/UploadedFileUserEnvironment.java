/*
 * User environment for uploaded files
 */
package uk.ac.antarctica.mapengine.model;

public class UploadedFileUserEnvironment {

    private String userName;
    private String userPgSchema;
    private String userPgLayer;
    private String userDatastore;
    
    public UploadedFileUserEnvironment() {
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserPgSchema() {
        return userPgSchema;
    }

    public void setUserPgSchema(String userPgSchema) {
        this.userPgSchema = userPgSchema;
    }  
    
    public String getUserPgLayer() {
        return userPgLayer;
    }

    public void setUserPgLayer(String userPgLayer) {
        this.userPgLayer = userPgLayer;
    }

    public String getUserDatastore() {
        return userDatastore;
    }

    public void setUserDatastore(String userDatastore) {
        this.userDatastore = userDatastore;
    }        
    
}
