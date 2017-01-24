/*
 * Models a feedback report
 */
package uk.ac.antarctica.mapengine.model;

import java.util.Date;
import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotEmpty;

public class Feedback {
    
    @NotEmpty
    private String subject;
	private int projectId = 121;    /* Goes into ADD project by default */
	private String section = "MAGIC";
	private int trackerId = 1;      /* 1 = bug */
	private int assignedId = 6;
    @NotEmpty
	private String description;     /* Structured description for easy replay of issue */
    @Email @NotEmpty
	private String reporter = "";	/* Reporter email address for feedback */

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public int getProjectId() {
		return projectId;
	}

	public void setProjectId(int projectId) {
		this.projectId = projectId;
	}

	public String getSection() {
		return section;
	}

	public void setSection(String section) {
		this.section = section;
	}

	public int getTrackerId() {
		return trackerId;
	}

	public void setTrackerId(int trackerId) {
		this.trackerId = trackerId;
	}

	public int getAssignedId() {
		return assignedId;
	}

	public void setAssignedId(int assignedId) {
		this.assignedId = assignedId;
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
    
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("------------------------\n");
        sb.append("User feedback payload\n");
        sb.append("------------------------\n");
        sb.append("Reported : ");
        sb.append(new Date().toString());
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
        sb.append("------------------------\n");
        sb.append("End of feedback payload\n");
        sb.append("------------------------\n");
        return(sb.toString());
    }
    
}
