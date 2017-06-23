/*
 * User environment for uploaded files
 */
package uk.ac.antarctica.mapengine.model;

public class UploadedFileUserEnvironment {

    private String userName;
    private String userPgSchema;

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

}
