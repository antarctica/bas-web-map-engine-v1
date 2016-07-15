/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.GeoServerRESTPublisher;
import it.geosolutions.geoserver.rest.encoder.GSLayerEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.FeatureTypeAttribute;
import it.geosolutions.geoserver.rest.encoder.feature.GSAttributeEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.GSFeatureTypeEncoder;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class DataPublishController {
    
    /* OS-specific directory path separator */
    private static final String SEP = System.getProperty("file.separator");
    
    /* Upload temporary working directory base name */
    private static final String WDBASE = System.getProperty("java.io.tmpdir") + SEP + "upload_";

    @Autowired
    Environment env;

    @Autowired
    private JdbcTemplate magicDataTpl;

    private Runtime appRuntime = Runtime.getRuntime();

    private GeoServerRESTPublisher grp = null;

    @RequestMapping(value = "/publish_postgis", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> publishToPostGIS(MultipartHttpServletRequest request) throws Exception {
        
        ResponseEntity<String> ret = null;
        int count = 1;       
        ArrayList<String> statusMessages = new ArrayList();        
        grp = new GeoServerRESTPublisher(env.getProperty("geoserver.local.url"), env.getProperty("geoserver.local.username"), env.getProperty("geoserver.local.password"));
        String userName = (request.getUserPrincipal() != null) ? request.getUserPrincipal().getName() : "guest";        
        
        for (MultipartFile mpf : request.getFileMap().values()) {
            
            System.out.println("*** File no " + count);
            System.out.println("Original name : " + mpf.getOriginalFilename());
            System.out.println("Name : " + mpf.getName());
            System.out.println("Content type : " + mpf.getContentType());
            System.out.println("Size : " + mpf.getSize());
            System.out.println("*** End of file no " + count);
            
            String stdName = standardiseName(mpf.getOriginalFilename());
            String extension = FilenameUtils.getExtension(stdName);
            File wd = new File(WDBASE + Calendar.getInstance().getTimeInMillis());
            try {
                if (wd.mkdir()) {
                    /* Created the working directory */
                    File uploaded = new File(wd.getAbsolutePath() + SEP + stdName);
                    mpf.transferTo(uploaded);
                    UploadedFileMetadata md = extractMetadata(mpf, userName);
                    if (extension.equals("gpx") || extension.equals("kml")) {
                        statusMessages.add(publishGpxKml(uploaded, md));
                    } else if (extension.equals("csv")) {
                        statusMessages.add(publishCsv(uploaded, md));
                    } else if (extension.equals("zip")) {
                        statusMessages.add(publishShp(uploaded, md));
                    }
                } else {
                    /* Failed to create */
                    ret = PackagingUtils.packageResults(HttpStatus.INTERNAL_SERVER_ERROR, null, "Failed to create temporary working dir " + wd.getName());
                }
            } catch (IOException | IllegalStateException ex) {
                ret = PackagingUtils.packageResults(HttpStatus.INTERNAL_SERVER_ERROR, null, "Error transferring uploaded file to dir " + wd.getName() + " - " + ex.getMessage());
            }           
            count++;
        }
        return(ret);
    }

    /**
     * Publishing workflow for uploaded GPX or KML file
     * @param File uploaded
     * @param UploadedFileMetadata md
     * @return String
     */
    @Transactional
    private String publishGpxKml(File uploaded, UploadedFileMetadata md) {
        
        String message = "";
        
        String pgSchema = FilenameUtils.getExtension(uploaded.getName()) + "_temp_" + Calendar.getInstance().getTimeInMillis();
        String pgUploadSchema = env.getProperty("datasource.magic.userUploadSchema");
        String pgUser = env.getProperty("datasource.magic.username");
        String pgPass = env.getProperty("datasource.magic.password").replaceAll("!", "\\!");    /* ! is a shell metacharacter */

        message = createUploadConversionSchema(pgSchema);
        if (message.isEmpty()) {
            /* Successful schema creation - now construct ogr2ogr command to run to convert GPX to PostGIS
             * example: 
             * ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=<schema> user=<user> password=<pass>' punta_to_rothera.gpx 
             */
            try {
                String cmd = "ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=" + pgSchema + " user=" + pgUser + " password=" + pgPass + "' " + uploaded.getAbsolutePath();
                Process ogrProc = appRuntime.exec(cmd);
                ProcessWithTimeout ogrProcTimeout = new ProcessWithTimeout(ogrProc);
                int ogrProcRet = ogrProcTimeout.waitForProcess(30000);  /* Timeout in milliseconds */
                if (ogrProcRet == 0) {
                    /* Normal termination 
                     * ogr2ogr will have created routes, tracks and waypoints tables - not all of these will have any content depending on the data - delete all empty ones
                     */
                    List<Map<String,Object>> createdTables = magicDataTpl.queryForList("SELECT table_name FROM information_schema.tables WHERE table_schema=?", pgSchema);
                    if (!createdTables.isEmpty()) {
                        /* Some tables created */
                        for (Map<String,Object> pgTableRec : createdTables) {
                            String pgTable = standardiseName((String)pgTableRec.get("table_name"));
                            String srcTableName = pgSchema + "." + pgTable;
                            String destTableName = pgUploadSchema + "." + FilenameUtils.getBaseName(uploaded.getName()) + "_" + pgTable;
                            int nRecs = magicDataTpl.queryForObject("SELECT count(*) FROM " + pgSchema + "." + pgTable, Integer.class);
                            if (nRecs > 0) {
                                /* Copy records from non-empty table into user uploads schema with a user-friendly name */                                
                                magicDataTpl.execute("CREATE TABLE " + destTableName + " AS SELECT * FROM " + srcTableName);
                                /* Now publish to Geoserver */                                                      
                                boolean published = grp.publishDBLayer(
                                    env.getProperty("geoserver.local.userWorkspace"), 
                                    env.getProperty("geoserver.local.userPostgis"), 
                                    configureFeatureType(md, destTableName), 
                                    configureLayer(getGeometryType(destTableName))
                                );
                                message = "Publishing PostGIS table " + pgTable + " to Geoserver " + (published ? "succeeded" : "failed");
                            }                        
                        }
                    } else {
                        message = "Conversion process completed successfully but created no data";
                    }
                    /* Delete the temporary schema and all contents */
                    magicDataTpl.execute("DROP SCHEMA " + pgSchema + " CASCADE");
                } else if (ogrProcRet == Integer.MIN_VALUE) {
                    /* Timeout */
                    message = "No response from conversion process after 30 seconds - aborted";
                } else {
                    /* Unexpected process return */
                    message = "Unexpected return " + ogrProcRet + " from GPX to PostGIS process";
                }
            } catch (IOException ioe) {
                message = "Failed to start conversion process from GPX to PostGIS - error was " + ioe.getMessage();
            } catch (DataAccessException dae) {
                message = "Database error occurred during GPX to PostGIS conversion - message was " + dae.getMessage();
            }
        }
        return (uploaded.getName() + ": " + message);
    }

    /**
     * Publishing workflow for uploaded CSV file (comma-delimited, double quotes, first record is column header names)
     * @param File uploaded
     * @param UploadedFileMetadata md
     * @return String
     */
    @Transactional
    private String publishCsv(File uploaded, UploadedFileMetadata md) {
        
        String message = "";
        
        String pgTable = env.getProperty("datasource.magic.userUploadSchema") + "." + md.getName();
        try {
            FileReader fileInput = new FileReader(uploaded);
            boolean gotHeaders = false;
            LinkedHashMap<String, String> columnTypes = new LinkedHashMap();
            for (CSVRecord record : CSVFormat.DEFAULT.parse(fileInput)) {
                if (!gotHeaders) {
                    /* These are the headers - create a list of names - bomb the process if any are empty or numeric */
                    for (int i = 0; i < record.size(); i++) {
                        String colName = record.get(i);
                        if (colName.isEmpty() || StringUtils.isNumeric(colName)) {
                            message = "Bad column name >" + colName + "< in first row - check this contains the attribute names";
                            break;
                        } else {
                            /* Initialise the Postgres type */
                            columnTypes.put(colName, null);
                        }
                    }
                    if (message.isEmpty()) {
                        gotHeaders = true;
                    }                    
                } else {
                    /* Feature record */
                    int i = 0;
                    for (String key : columnTypes.keySet()) {
                        String attrValue = record.get(i);
                        String currAttrType = columnTypes.get(key);
                        String thisAttrType = getPostgresType(attrValue);
                        if (currAttrType == null || (getTypePriority(thisAttrType) > getTypePriority(currAttrType))) {
                            columnTypes.put(key, thisAttrType);
                        }
                        i++;
                    }                    
                }
                if (!message.isEmpty()) {
                    break;
                }
            }
            if (message.isEmpty()) {
                /* Create the table based on the column types deduced by the file scan above */
                
            }
            
        } catch (FileNotFoundException ex) {
            Logger.getLogger(DataPublishController.class.getName()).log(Level.SEVERE, null, ex);
        } catch (IOException ex) {
            Logger.getLogger(DataPublishController.class.getName()).log(Level.SEVERE, null, ex);
        }
        
        
        return (message);
    }

    /**
     * Publishing workflow for uploaded SHP file
     * @param File uploaded
     * @param MultipartFile mpf
     * @return String
     */
    @Transactional
    private String publishShp(File uploaded, UploadedFileMetadata md) {
        String message = "";
        return (message);
    }

    /**
     * Create a standardised file (and hence table) name from the user's
     * filename - done by lowercasing, converting all non-alphanumerics to _ and
     * sequences of _ to single _
     * @param String fileName
     * @return String
     */
    private String standardiseName(String fileName) {
        String stdName = "";
        if (fileName != null && !fileName.isEmpty()) {
            stdName = fileName.toLowerCase().replaceAll("[^a-z0-9.]", "_").replaceAll("_{2,}", "_");
        }
        return (stdName);
    }

    /**
     * Create a new database schema to receive tables created from an uploaded file
     * @param String name
     * @return String
     */
    private String createUploadConversionSchema(String name) {
        String message = "";
        try {
            magicDataTpl.execute("CREATE SCHEMA IF NOT EXISTS " + name + " AUTHORIZATION " + env.getProperty("datasource.magic.username"));
        } catch (DataAccessException dae) {
            message = "Failed to create schema " + name + ", error was " + dae.getMessage();
        }
        return (message);
    }

    /**
     * Construct the attribute map for Geoserver Manager for <schema>.<table>     
     * @param UploadedFileMetadat md
     * @param String destTableName
     * @return GSFeatureTypeEncoder
     */
    private GSFeatureTypeEncoder configureFeatureType(UploadedFileMetadata md, String destTableName) throws DataAccessException {
        GSFeatureTypeEncoder gsfte = new GSFeatureTypeEncoder();
        String tsch = destTableName.substring(0, destTableName.indexOf("."));
        String tname = destTableName.substring(destTableName.indexOf(".") + 1);
        List<Map<String, Object>> recs = magicDataTpl.queryForList("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema=? AND table_name=?", tname, tsch);
        if (!recs.isEmpty()) {
            for (Map<String, Object> rec : recs) {
                /* Create Geoserver Manager's configuration */
                String colName = (String) rec.get("column_name");
                String isNillable = (String) rec.get("is_nullable");
                String dataType = getDataTypeBinding((String) rec.get("data_type"));
                GSAttributeEncoder attribute = new GSAttributeEncoder();
                attribute.setAttribute(FeatureTypeAttribute.name, colName);
                attribute.setAttribute(FeatureTypeAttribute.minOccurs, String.valueOf(0));
                attribute.setAttribute(FeatureTypeAttribute.minOccurs, String.valueOf(1));
                attribute.setAttribute(FeatureTypeAttribute.nillable, String.valueOf(isNillable.toLowerCase().equals("yes")));
                attribute.setAttribute(FeatureTypeAttribute.binding, dataType);
                gsfte.setAttribute(attribute);
                /* Add primary key if necessary */
                boolean isPk = isNillable.toLowerCase().equals("no");
                if (isPk) {
                    magicDataTpl.execute("ALTER TABLE " + destTableName + " ADD PRIMARY KEY (" + colName + ")");
                }
                /* Add index if necessary */
                boolean isGeom = dataType.toLowerCase().equals("user-defined");
                if (isGeom) {
                    magicDataTpl.execute("CREATE INDEX " + tname + "_geom_gist ON " + destTableName + " USING gist (" + colName + ")");
                }
            }
        }
        /* Now set feature metadata */
        gsfte.setNativeCRS(md.getSrs());
        gsfte.setSRS(md.getSrs());
        gsfte.setName(destTableName);
        gsfte.setTitle(md.getTitle());
        gsfte.setAbstract(md.getDescription());
        return(gsfte);
    }

    /**
     * Construct layer configurator for Geoserver Manager    
     * @param String defaultStyle
     * @return GSLayerEncoder
     */
    private GSLayerEncoder configureLayer(String defaultStyle) {
        GSLayerEncoder gsle = new GSLayerEncoder();
        gsle.setDefaultStyle(defaultStyle);
        gsle.setEnabled(true);
        gsle.setQueryable(true);
        return(gsle);
    }

    /**
     * Translate a PostgreSQL data type into a Java class binding (very simple,
     * may need to be extended if lots of other types come up)
     * @param String pgType
     * @return String
     */
    private String getDataTypeBinding(String pgType) {
        String jType = null;
        switch (pgType) {
            case "integer":
            case "bigint":
            case "smallint":
                jType = "java.lang.Integer";
                break;
            case "double precision":
            case "numeric":
                jType = "java.lang.Double";
                break;
            case "timestamp with time zone":
            case "timestamp without time zone":
            case "date":
                jType = "java.sql.Date";
                break;
            case "USER-DEFINED":
                jType = "com.vividsolutions.jts.geom.Geometry";
                break;
            default:
                jType = "java.lang.String";
                break;
        }
        return (jType);
    }

    /**
     * Get a plausible Postgres type for this value
     * NOTE: limited to integer, numeric or character varying()
     * @param String s
     * @return String
     */
    private String getPostgresType(String s) {
        String type = "character varying";
        try {
            Integer.parseInt(s);
            type = "integer";
        } catch(NumberFormatException | NullPointerException ex) {            
            try {
                Double.parseDouble(s);
                type = "numeric";
            } catch(NumberFormatException | NullPointerException ex2) {   
                if (type.length() > 254) {
                    type = "text";
                }
            }
        }
        return(type);
    }

    /**
     * Assign an integer priority to the given Postgres data type
     * NOTE: limited to integer, numeric, character varying() or text
     * @param dataType
     * @return 
     */
    private int getTypePriority(String dataType) {
        int priority = -999;
        if (dataType.equals("integer")) {
            priority = 1;
        } else if (dataType.equals("numeric")) {
            priority = 2;
        } else if (dataType.startsWith("character varying")) {
            priority = 3;
        } else if (dataType.equals("text")) {
            priority = 4;
        }
        return(priority);
    }           
    
    /**
     * Does this column name look like it's a latitude?
     * @param String colName
     * @return boolean
     */
    private boolean candidateLatitudeColumn(String colName) {
        String[] knownNames = new String[] {
            "lat",
            "latitude",
            "y",
            "north",
            "northing",
            "cy",
            "ycoord",
            "ycoordinate"
        };
        colName = colName.trim().toLowerCase().replaceAll("[^a-z]", "");
        return(ArrayUtils.contains(knownNames, colName));
    }
    
    /**
     * Does this column name look like it's a longitude?
     * @param String colName
     * @return boolean
     */
    private boolean candidateLongitudeColumn(String colName) {
        String[] knownNames = new String[] {
            "lon",
            "long",
            "longitude",
            "x",
            "east",
            "easting",
            "cx",
            "xcoord",
            "xcoordinate"
        };
        colName = colName.trim().toLowerCase().replaceAll("[^a-z]", "");
        return(ArrayUtils.contains(knownNames, colName));
    }            

}
