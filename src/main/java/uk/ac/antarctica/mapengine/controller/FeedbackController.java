/*
 * Track feedbacxk using Redmine issue tracker
 */

package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.net.URLEncoder;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import uk.ac.antarctica.mapengine.model.Feedback;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class FeedbackController {
    
    private static final String REDMINE_ISSUE = "http://basweb.nerc-bas.ac.uk/south/api/redmine/issue.php";
   
   /**
	 * Record feedback as a Redmine issue
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
        ResponseEntity<String> ret = null;
        if (result.hasErrors()) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Invalid form data " + feedback.toString());
        } else {
            try {
				feedback.setProjectId(121);
				String redmineUrl = REDMINE_ISSUE + "?" +
					"subject=" + URLEncoder.encode(feedback.getSubject(), "UTF-8") + "&" +
					"project_id=" + feedback.getProjectId() + "&" +
					"section=" + URLEncoder.encode(feedback.getSection(), "UTF-8") + "&" +
					"tracker_id=" + feedback.getTrackerId() + "&" +
					"assigned_to_id=" + feedback.getAssignedId() + "&" +
                    "email=" + URLEncoder.encode(feedback.getReporter(), "UTF-8") + "&" + 
					"description=" + URLEncoder.encode(feedback.getDescription(), "UTF-8");
                String reportContent = HTTPUtils.get(redmineUrl, "magic_auto", "magic123");
                try {
                    int issueId = Integer.parseInt(reportContent);
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully submitted - issue added with id " + issueId);
                } catch(NumberFormatException nfe) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Failed to enter data into tracking system");
                }
			} catch(Exception ex) {
				ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error entering data into tracker, message was: " + ex.getMessage());
			}
        }
        return(ret);
    }
    
}
