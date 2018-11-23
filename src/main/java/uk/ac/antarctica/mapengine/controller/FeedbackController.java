/*
 * Track user feedback to a Postgres issues table
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpHeaders;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.methods.RequestBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.postgresql.util.PGobject;
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
    
    @Autowired
    private Gson jsonMapper;
    

    /**
     * Record user feedback in the issues table
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
                    Integer insertedId = magicDataTpl.queryForObject("INSERT INTO " + issuesTable + " " + 
                        "(issuetype, subject, description, reporter, payload, updated) " + 
                        "VALUES(?,?,?,?,?,current_timestamp) RETURNING id", new Object[]{
                        feedback.getIssuetype(),
                        feedback.getSubject(),
                        feedback.getDescription(),
                        feedback.getReporter(),
                        getJsonDataAsPgObject(feedback.getMapdata())
                    }, Integer.class);
                    /* Now write the data as an issue in GitLab */
                    int gitlabIssue = postToGitLab(
                        feedback.getSubject(), 
                        assembleDescription(feedback.getMapdata(), feedback.getDescription(), feedback.getReporter(), insertedId), 
                        LocalDate.now().plusMonths(1).toString(),
                        LocalDate.now().toString(),
                        ""
                    );
                    if (gitlabIssue != -1) {
                        /* Successfully added to GitLab, record project and issue id in issues table */
                        String gitlabUrl = env.getProperty("gitlab.url", "");
                        magicDataTpl.update("UPDATE " + issuesTable + " SET gitlab=?, gitlab_id=? WHERE id=?", gitlabUrl, gitlabIssue, insertedId);
                        ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully added issue with id " + insertedId + " to issues database");
                    } else {
                        ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Added issue with id " + insertedId + " to database but NOT to GitLab");
                    }                    
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
                ret = PackagingUtils.packageResults(HttpStatus.OK, jsonMapper.toJsonTree(issues).toString(), null);
            } catch (DataAccessException dae) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Database error : " + dae.getMessage() + " fetching issue records");
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No issues table defined => this form of tracking not available");
        }
        return (ret);
    }
    
    /**
     * Create a suitable description for the GitLab issue
     * 
     * @param mapData
     * @param desc
     * @param reporter
     * @param issueId
     * @return 
     */
    private String assembleDescription(String mapData, String desc, String reporter, int issueId) {
        StringBuilder sb = new StringBuilder();
        String mapUrl = null;
        try {
            JsonElement jp = new JsonParser().parse(mapData);
            if (jp.isJsonObject()) {
                JsonObject jo = jp.getAsJsonObject();
                mapUrl = jo.get("mapUrl").getAsString() + "/issue/" + issueId;                
            }
        } catch(JsonParseException je) {            
        }
        sb
            .append(desc)
            .append("<br>")
            .append("Reported by : ")
            .append(reporter);            
        if (mapUrl != null) {
            sb
                .append("<br>")
                .append("<a href=\"")                
                .append(mapUrl) 
                .append("\">Click here to view the problem in the map context</a>");
        }
        return(sb.toString());                
    }
    
    /**
     * Do the POST request to GitLab and return the issue id (or -1 if the submission failed for some reason)
     *
     * @param title       request title
     * @param description request longer description
     * @param requiredBy  due date
     * @param created     creation date at ISO 8601
     * @param labels      issue labels
     * @return id of new GitLab issue
     */
    private int postToGitLab(String title, String description, String requiredBy, String created, String labels) {

        int issueId = -1;
        CloseableHttpClient client = HttpClients.custom().build();
        
        String gitlabApi = env.getProperty("gitlab.api", "");
        String gitlabPat = env.getProperty("gitlab.bot_pat", "");
        String gitLabDefAssign = env.getProperty("gitlab.assignee_id", "21");
        
        if (!(gitlabApi.isEmpty() && gitlabPat.isEmpty())) {       
            /*
             * Trace inputs
             */
            System.out.println("===== POST request to GitLab at " + gitlabApi + " =====");
            System.out.println("Title : " + title);
            System.out.println("Description : " + description);
            System.out.println("Due date : " + requiredBy);
            System.out.println("Created at : " + created);
            System.out.println("Labels : " + labels);
            System.out.println("Assigning to user ID : " + gitLabDefAssign);
            System.out.println("===== End of trace =====");

            HttpUriRequest request = RequestBuilder.post()
                    .setUri(gitlabApi)
                    .setHeader(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded")
                    .setHeader("PRIVATE-TOKEN", gitlabPat)
                    .addParameter("title", title)
                    .addParameter("description", description)
                    .addParameter("due_date", requiredBy)
                    .addParameter("create_at", created)
                    .addParameter("labels", labels)
                    .addParameter("assignee_ids", gitLabDefAssign)
                    .build();
            try {
                CloseableHttpResponse response = client.execute(request);
                int status = response.getStatusLine().getStatusCode();
                if (status < 400) {
                    /*
                     * Post worked, so attempt to parse the JSON output - example below:
                     * {
                     * "id": 2588,
                     * "iid": 77,
                     * "project_id": 465,
                     * "title": "test issue",
                     * "description": "please delete",
                     * "state": "opened",
                     * "created_at": "2018-07-05T08:55:41.472Z",
                     * "updated_at": "2018-07-05T08:55:41.472Z",
                     * "labels": [
                     * "Bug",
                     * "Normal",
                     * "Open"
                     * ],
                     * "milestone": null,
                     * "author": {
                     * "id": 21,
                     * "name": "Herbert, David J.",
                     * "username": "darb1",
                     * "state": "active",
                     * "avatar_url": "https://secure.gravatar.com/avatar/1ff97033954339ab59c5d6c932881642?s=80&d=identicon",
                     * "web_url": "https://gitlab.data.bas.ac.uk/darb1"
                     * },
                     * "assignee": null,
                     * "user_notes_count": 0,
                     * "upvotes": 0,
                     * "downvotes": 0,
                     * "due_date": "2018-07-31",
                     * "confidential": false,
                     * "web_url": "https://gitlab.data.bas.ac.uk/MAGIC/add/issues/77",
                     * "subscribed": true
                     * }
                     */
                    System.out.println("===== GitLab POST succeeded =====");
                    try {
                        String content = IOUtils.toString(response.getEntity().getContent());
                        JsonObject glOut = new JsonParser().parse(content).getAsJsonObject();
                        System.out.println("Successfully parsed JSON content output");
                        issueId = glOut.get("iid").getAsInt();
                        System.out.println("Created new issue with id " + issueId);
                    } catch (JsonSyntaxException | IOException | UnsupportedOperationException ex) {
                        System.out.println("Failed to parse JSON content output");
                    }
                    System.out.println("===== End of GitLab POST success message =====");
                } else {
                    /*
                     * Failed - log the errors
                     */
                    System.out.println("===== GitLab POST failed =====");
                    System.out.println("Status code : " + status + " returned by GitLab");
                    System.out.println("Content return from GitLab follows:");
                    System.out.println(IOUtils.toString(response.getEntity().getContent()));
                    System.out.println("===== End of GitLab failure message =====");
                }
            } catch (IOException ex) {
                System.out.println("===== GitLab POST failed with an IO exception =====");
                System.out.println("Details : " + ex.getMessage());
                System.out.println("===== End of GitLab exception report =====");
            }
        } else {
            System.out.println("===== No GitLab project or credentials supplied - nothing to do =====");
        }
        return (issueId);
    }

    /**
     * Allow a value to be written into a JSON field
     * 
     * @param mapdata
     * @return 
     */
    private Object getJsonDataAsPgObject(String mapdata) {
        /* A bit of "cargo-cult" programming from https://github.com/denishpatel/java/blob/master/PgJSONExample.java - what a palaver! */
        PGobject dataObject = new PGobject();
        dataObject.setType("json");
        try {
            dataObject.setValue(mapdata);
        } catch (SQLException ex) {
            System.out.println("Problem preparing JSON value for PostGIS ingestion : " + ex.getMessage());
        }
        return(dataObject);
    }

}
