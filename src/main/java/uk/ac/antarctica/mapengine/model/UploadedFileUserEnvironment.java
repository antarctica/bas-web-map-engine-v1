/*
 * User environment for uploaded files
 */
package uk.ac.antarctica.mapengine.model;

public class UploadedFileUserEnvironment {

    private String userName;
    private String userPgSchema;
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

    public String getUserDatastore() {
        return userDatastore;
    }

    public void setUserDatastore(String userDatastore) {
        this.userDatastore = userDatastore;
    }        

}
