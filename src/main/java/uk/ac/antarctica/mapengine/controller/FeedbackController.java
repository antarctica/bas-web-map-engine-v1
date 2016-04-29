/*
 * Track feedbacxk using Redmine issue tracker
 */

package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.net.URI;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.apache.http.client.utils.URIBuilder;
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
    
    private static final String REDMINE_ISSUE = "http://basweb.nerc-bas.ac.uk/south-legacy/api/redmine/issue.php";
   
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
                ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully added issue to tracking system");                
			} catch(Exception ex) {
				ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error entering data into tracker, message was: " + ex.getMessage());                
			}
        }
        return(ret);
    }
    
}
