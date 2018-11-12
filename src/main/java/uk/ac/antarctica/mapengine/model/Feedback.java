/*
 * Models a user feedback issue report
 */
package uk.ac.antarctica.mapengine.model;

import java.util.Date;
import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotEmpty;

public class Feedback {

    @NotEmpty
    private String issuetype;
    @NotEmpty
    private String subject;    
    @NotEmpty
    private String description;    
    @Email
    @NotEmpty
    private String reporter;
    @NotEmpty
    private String mapdata;

    public String getIssuetype() {
        return issuetype;
    }

    public void setIssuetype(String issuetype) {
        this.issuetype = issuetype;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReporter() {
        return reporter;
    }

    public void setReporter(String reporter) {
        this.reporter = reporter;
    }

    public String getMapdata() {
        return mapdata;
    }

    public void setMapdata(String mapdata) {
        this.mapdata = mapdata;
    }
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("------------------------\n");
        sb.append("User feedback payload\n");
        sb.append("------------------------\n");
        sb.append("Reported : ");
        sb.append(new Date().toString());
        sb.append("\n");
        sb.append("Type of issue : ");
        sb.append(getIssuetype());
        sb.append("\n");
        sb.append("Subject : ");
        sb.append(getSubject());
        sb.append("\n");
        sb.append("Description : ");
        sb.append(getDescription());
        sb.append("\n");
        sb.append("Reporter : ");
        sb.append(getReporter());
        sb.append("\n");
        sb.append("Replay JSON : ");
        sb.append(getMapdata());
        sb.append("\n");
        sb.append("------------------------\n");
        sb.append("End of feedback payload\n");
        sb.append("------------------------\n");
        return (sb.toString());
    }

}
