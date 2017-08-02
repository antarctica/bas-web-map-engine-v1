/*
 * Track feedbacxk using Redmine issue tracker
 */

package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.net.URI;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.apache.http.client.utils.URIBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import uk.ac.antarctica.mapengine.model.Feedback;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class FeedbackController {
    
    private static final String REDMINE_ISSUE = "http://basweb.nerc-bas.ac.uk/south-legacy/api/redmine/issue.php";
    
    @Autowired
    Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;

    /* JSON mapper */
    private final Gson mapper = new Gson();   
   
   /**
	 * Record user feedback either as a Redmine issue (BAS) or in the issues table (other systems)
	 * @param HttpServletRequest request
     * @param HttpServletResponse response
	 * @param String url
	 * @return String
	 * @throws ServletException
	 * @throws IOException 
	 */
	@RequestMapping(value="/feedback", method=RequestMethod.POST, headers = {"Content-type=application/json"})	
	public ResponseEntity<String> feedback(HttpServletRequest request,
		@Valid @RequestBody Feedback feedback, 
		BindingResult result, 
		ModelMap map)
        throws ServletException, IOException {        
        ResponseEntity<String> ret;                
        if (result.hasErrors()) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Invalid form data " + feedback.toString());
        } else {
            String issuesTable = env.getProperty("postgres.local.issuesTable");
            if (issuesTable != null && !issuesTable.isEmpty()) {
                /* Insert a record into the local issues table */
                System.out.println("**** Issue reported at " + new Date().toString() + "****");
                System.out.println(feedback.toString());
                System.out.println("**** End of issue data ****");
                try {
                    magicDataTpl.update("INSERT INTO issuesTable VALUES(?,?,?,current_timestamp[)", new Object[]{
                        feedback.getSubject(),
                        feedback.getDescription(),
                        feedback.getReporter()
                    });
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully added issue to issues database"); 
                } catch(DataAccessException dae) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error entering data into issues table, message was: " + dae.getMessage());
                }
            } else {
                /* Use BAS Redmine */
                try {
                    feedback.setProjectId(121);     /* ADD - if we want to write to others this will have to be set in the creation of the map */
                    URI uri = new URIBuilder(new URI(REDMINE_ISSUE))
                        .addParameter("subject", feedback.getSubject())
                        .addParameter("project_id", feedback.getProjectId() + "")
                        .addParameter("section", feedback.getSection())
                        .addParameter("tracker_id", feedback.getTrackerId() + "")
                        .addParameter("assigned_to_id", feedback.getAssignedId() + "")
                        .addParameter("email", feedback.getReporter())
                        .addParameter("description", feedback.getDescription())
                        .build();                 
                    HTTPUtils.get(uri.toURL().toString(), "magic_auto", "magic123");
                    /* Output the email address to the system log as there is a bug in the Redmine API which means it isn't getting captured as of 2017-01-24 */
                    System.out.println(feedback.toString());
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully added issue to tracking system");                
                } catch(Exception ex) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error entering data into tracker, message was: " + ex.getMessage());                
                }
            }
        }
        return(ret);
    }
    
    /**
     * JSON output of all issue data (for non-Redmine systems)   
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/feedback/issues/all", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> allIssues(HttpServletRequest request) throws ServletException, IOException {
        ResponseEntity<String> ret;
        String userName = request.getUserPrincipal().getName();
        String issuesTable = env.getProperty("postgres.local.issuesTable");
        if (issuesTable != null && !issuesTable.isEmpty()) {
            /* There's an issues table */
            try {
                List<Map<String, Object>> issues = magicDataTpl.queryForList("SELECT * FROM " + issuesTable + " ORDER by updated_on DESC");            
                ret = PackagingUtils.packageResults(HttpStatus.OK, mapper.toJsonTree(issues).toString(), null);
            } catch(DataAccessException dae) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Database error : " + dae.getMessage() + " fetching issue records");
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No issues table defined => this form of tracking not available");
        }
        return(ret);
    }        
        
}
