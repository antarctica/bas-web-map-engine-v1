/*
 * Track user feedback to a Postgres issues table
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
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

    @Autowired
    Environment env;

    @Autowired
    private JdbcTemplate magicDataTpl;

    /*
     * JSON mapper
     */
    private final Gson mapper = new Gson();

    /**
     * Record user feedback either as a Redmine issue (BAS) or in the issues table (other systems)
     *
     * @param HttpServletRequest  request
     * @param HttpServletResponse response
     * @param String              url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/feedback", method = RequestMethod.POST, headers = {"Content-type=application/json"})
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
                /*
                 * Insert a record into the local issues table
                 */
                System.out.println("**** Issue reported at " + new Date().toString() + "****");
                System.out.println(feedback.toString());
                System.out.println("**** End of issue data ****");
                try {
                    magicDataTpl.update("INSERT INTO " + issuesTable + " " + 
                        "(issuetype, subject, description, reporter, payload, updated) " + 
                        "VALUES(?,?,?,?,?,current_timestamp)", new Object[]{
                        feedback.getIssuetype(),
                        feedback.getSubject(),
                        feedback.getDescription(),
                        feedback.getReporter(),
                        feedback.getPayload()
                    });
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully added issue to issues database");
                } catch (DataAccessException dae) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error entering data into issues table, message was: " + dae.getMessage());
                }
            } else {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No issues table defined => this form of tracking not available");
            }
        }
        return (ret);
    }

    /**
     * JSON output of all issue data
     *
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/feedback/issues/all", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> allIssues(HttpServletRequest request) throws ServletException, IOException {
        ResponseEntity<String> ret;
        String issuesTable = env.getProperty("postgres.local.issuesTable");
        if (issuesTable != null && !issuesTable.isEmpty()) {
            /*
             * There's an issues table
             */
            try {
                List<Map<String, Object>> issues = magicDataTpl.queryForList("SELECT * FROM " + issuesTable + " ORDER by updated_on DESC");
                ret = PackagingUtils.packageResults(HttpStatus.OK, mapper.toJsonTree(issues).toString(), null);
            } catch (DataAccessException dae) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Database error : " + dae.getMessage() + " fetching issue records");
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No issues table defined => this form of tracking not available");
        }
        return (ret);
    }

}
