/*
 * API for Rothera Fieldwork Reports Search
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class RotheraReportsController {
    
    /**
     * NOTE: 2017-11-09 David.  All the functionality in this controller needs to be replaced as far as possible by MODES API calls - the tables below are populated 
     * from a dump of the data in MODES from Joanna Rae for the purposes of getting a working system for Rothera Field Season 2017-18
     */
    
    @Autowired
    Environment env;
        
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    private static final String ROTHERA_REPORTS_TABLE = "opsgis2.rothera_reports";
    private static final String ROTHERA_REPORTS_PLACES_TABLE = "opsgis2.rothera_report_places";
    
    private static final String REPORTS_DIRECTORY = "/data/opsgis/rothera_fieldwork_reports";
    
    /**
     * Search for Rothera Fieldwork reports (highly BAS-specific - do not offer this externally)
     * @param HttpServletRequest request
     * @param String payload
     * @return ResponseEntity<String>
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/rothera_reports", method = RequestMethod.POST, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> searchReports(HttpServletRequest request, @RequestBody String payload) throws ServletException, IOException {
        ResponseEntity<String> ret;
        System.out.println(payload);
        String baseQuery = 
            "SELECT a.id, " +
            "b.strplaces, st_astext(st_transform(st_centroid(b.convhull),4326)) as centroid FROM " +
            "(" +
            "SELECT id, title, description, startdate, enddate, filename, " +
            "array_to_string(people, '~') AS strpeople, array_to_string(keywords, '~') AS strkeywords FROM " + ROTHERA_REPORTS_TABLE +
            ") a " +
            "INNER JOIN " +
            "(" +
            "SELECT " + ROTHERA_REPORTS_TABLE + ".id AS id, " +
            "string_agg(distinct " + ROTHERA_REPORTS_PLACES_TABLE + ".placename, '~') AS strplacename, " +
            "string_agg(distinct " + ROTHERA_REPORTS_PLACES_TABLE + ".placename || ' ' || st_astext(st_geomfromtext('POINT(' || " + ROTHERA_REPORTS_PLACES_TABLE + ".lon || ' ' || " + ROTHERA_REPORTS_PLACES_TABLE + ".lat || ')', 4326)), '~') AS strplaces, " +
            "st_convexhull(st_collect(" + ROTHERA_REPORTS_PLACES_TABLE + ".geom)) AS convhull FROM " + ROTHERA_REPORTS_TABLE + ", " + ROTHERA_REPORTS_PLACES_TABLE + " " +
            "WHERE " + ROTHERA_REPORTS_TABLE + ".id = " + ROTHERA_REPORTS_PLACES_TABLE + ".reportid GROUP BY " + ROTHERA_REPORTS_TABLE + ".id" +
            ") b " +
            "ON a.id = b.id " + 
            "WHERE TRUE AND ";
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        ArrayList<String> sqlArgs = new ArrayList();
        boolean whereAdded = false;
        
        StringBuilder sqlQueryBuilder = new StringBuilder();
        sqlQueryBuilder.append(baseQuery);
                        
        /* Retrieve form parameters and build SQL query */
        
        /* Place-names */
        StringBuilder locationsClause = new StringBuilder();
        String locations = jo.get("locations").getAsString();
        if (locations != null && !locations.isEmpty()) {
            /* Build location enquiry - first get location names into an array */
            String[] locationNames = locations.split(",");
            /* Now decompose location names into individual words to compensate for 'Mount Hope', 'Hope, Mount' etc */
            locationsClause.append("(");
            for (int i = 0; i < locationNames.length; i++) {
                String[] locWords = locationNames[i].split("[\\s,]+");
                locationsClause.append((i > 0 ? " OR " : ""));
                locationsClause.append("(");
                for (int j = 0; j < locWords.length; j++) {
                    locationsClause.append((j > 0 ? " AND " : ""));
                    locationsClause.append("lower(unaccent(strplacename)) LIKE ?");
                    sqlArgs.add("%" + locWords[j].toLowerCase() + "%");
                }
                locationsClause.append(")");                
            }
            locationsClause.append(")"); 
            sqlQueryBuilder.append(locationsClause.toString());
            sqlQueryBuilder.append(" AND ");
        }
        /* Participants */
        StringBuilder peopleClause = new StringBuilder();
        String people = jo.get("people").getAsString();
        if (people != null && !people.isEmpty()) {
            /* Build participant enquiry - first get names into an array */
            String[] peopleNames = people.split(",");
            /* Now decompose participant names into individual words to compensate for 'Mike Bentley', 'Bentley, Mike' etc */
            peopleClause.append("(");
            for (int i = 0; i < peopleNames.length; i++) {
                String[] nameWords = peopleNames[i].split("[\\s,]+");
                peopleClause.append((i > 0 ? " OR " : ""));
                peopleClause.append("(");
                for (int j = 0; j < nameWords.length; j++) {
                    peopleClause.append((j > 0 ? " AND " : ""));
                    peopleClause.append("lower(unaccent(strpeople)) LIKE ?");
                    sqlArgs.add("%" + nameWords[j].toLowerCase() + "%");
                }
                peopleClause.append(")");                
            }
            peopleClause.append(")");
            sqlQueryBuilder.append(peopleClause.toString());
            sqlQueryBuilder.append(" AND ");
        }
        /* Keywords (which also searches 'title' and 'description') */
        StringBuilder keywordsClause = new StringBuilder();
        String keywordList = jo.get("keywords").getAsString();
        if (keywordList != null && !keywordList.isEmpty()) {
            /* Build keyword enquiry - first get keywords into an array */
            String[] keywords = keywordList.split(",");
            keywordsClause.append("(");
            for (int i = 0; i < keywords.length; i++) {
                keywordsClause.append((i > 0 ? " AND " : ""));
                keywordsClause.append("(lower(title) LIKE ? OR lower(description) LIKE ? OR lower(strkeywords) LIKE ?)");
                sqlArgs.add("%" + keywords[i] + "%");
                sqlArgs.add("%" + keywords[i] + "%");
                sqlArgs.add("%" + keywords[i] + "%");                                                           
            }
            keywordsClause.append(")");     
            sqlQueryBuilder.append(keywordsClause.toString());
            sqlQueryBuilder.append(" AND ");
        }
        /* Dates */
        StringBuilder datesClause = new StringBuilder();
        String startDate = jo.get("startdate").getAsString();
        String endDate = jo.get("enddate").getAsString();
        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
            /* Build date enquiry */
            datesClause.append("(startdate IS NOT NULL AND startdate >= to_date(?, 'YYYY-MM-DD') AND enddate IS NOT NULL AND enddate <= to_date(?, 'YYYY-MM-DD'))");
            sqlArgs.add(startDate);
            sqlArgs.add(endDate);
            sqlQueryBuilder.append(datesClause.toString());
        }
        /* Strip final ' AND ' if present */
        String sqlQuery = sqlQueryBuilder.toString().replace("\\sAND\\s$", "");
        System.out.println(sqlQuery);
        try {            
            String [] sqlArgsArr = sqlArgs.toArray(new String[sqlArgs.size()]);
            List<Map<String, Object>> records = magicDataTpl.queryForList(sqlQuery, (Object[])sqlArgsArr);
            ret = PackagingUtils.packageResults(HttpStatus.OK, mapper.toJsonTree(records).toString(), null);
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error occurred, message was: " + dae.getMessage());
        }
        return (ret);
    }
    
    /**
     * Get full data for report with supplied MODES id
     * @param HttpServletRequest request,
     * @param String id
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/rothera_reports/data", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> fetchReportData(HttpServletRequest request,
        @RequestParam(value="id", required=true) String id) throws Exception {
        ResponseEntity<String> ret;
        System.out.println(id);
        try {
            Map<String, Object> record = magicDataTpl.queryForMap(
                "SELECT id, title, description, startdate, enddate, filename, array_to_string(people, '~') as people FROM " + ROTHERA_REPORTS_TABLE + " WHERE id=?", 
                id
            );
            System.out.println(mapper.toJsonTree(record).toString());
            ret = PackagingUtils.packageResults(HttpStatus.OK, mapper.toJsonTree(record).toString(), null);
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error occurred, message was: " + dae.getMessage());
        }        
        return (ret);
    }
    
    /**
     * Get full data for report with supplied MODES id
     * @param HttpServletRequest request,
     * @param String id
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/rothera_reports/serve", method = RequestMethod.GET, produces = {"image/jpg", "image/jpeg", "application/pdf", "application/vnd.ms-excel"})
    @ResponseBody
    public void serveReport(HttpServletRequest request, HttpServletResponse response,
        @RequestParam(value="filename", required=true) String filename) throws Exception {
        String reportFileName = REPORTS_DIRECTORY + "/" + filename;
        File reportFile = new File(reportFileName);
        String extension = FilenameUtils.getExtension(reportFileName);
        String mimeType = "application/pdf";
        if (reportFile.canRead()) {            
            switch(extension) {
                case "xls":
                    mimeType = "application/vnd.ms-excel";
                    break;
                case "jpg":
                    mimeType = "image/jpeg";
                    break;
                default:
                    break;
            }
            response.setContentType(mimeType);
            response.setHeader("Content-Disposition","attachment;filename=" + filename);
            FileInputStream fis = new FileInputStream(reportFile);
            IOUtils.copyLarge(fis, response.getOutputStream());
        } else {
            response.setContentType("text/plain");
            IOUtils.write("No readable file " + reportFileName, response.getOutputStream());
        }
    }
  
}
