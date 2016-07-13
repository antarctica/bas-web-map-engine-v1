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
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import org.apache.commons.io.FilenameUtils;
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
                    if (extension.equals("gpx")) {
                        statusMessages.add(publishGpx(uploaded, md));
                    } else if (extension.equals("kml")) {
                        statusMessages.add(publishKml(uploaded, md));
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
     * Publishing workflow for uploaded GPX file
     * @param File uploaded
     * @param UploadedFileMetadata md
     * @return String
     */
    @Transactional
    private String publishGpx(File uploaded, UploadedFileMetadata md) {
        
        String message = "";
        
        String pgSchema = "gpx_temp_" + Calendar.getInstance().getTimeInMillis();
        String pgUploadSchema = env.getProperty("datasource.magic.userUploadSchema");
        String pgUser = env.getProperty("datasource.magic.username");
        String pgPass = env.getProperty("datasource.magic.password").replaceAll("!", "\\!");    /* ! is a shell metacharacter */

        message = createGpxConversionSchema(pgSchema);
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
                    String[] createdTableNames = new String[]{"waypoints", "routes", "tracks"};
                    for (String pgTable : createdTableNames) {
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
                                configureLayer(pgTable.equals("waypoints") ? "point" : "line")
                            );
                            if (!published) {
                                message = "Publishing to Geoserver failed";
                            }
                        }
                        /* Delete the temporary schema and all contents */
                        magicDataTpl.execute("DROP SCHEMA " + pgSchema + " CASCADE");
                    }
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
     * Publishing workflow for uploaded KML file
     * @param File uploaded
     * @param UploadedFileMetadata md
     * @return String
     */
    @Transactional
    private String publishKml(File uploaded, UploadedFileMetadata md) {
        String message = "";
        String pgSchema = "kml_temp_" + Calendar.getInstance().getTimeInMillis();
        String pgUploadSchema = env.getProperty("datasource.magic.userUploadSchema");
        String pgUser = env.getProperty("datasource.magic.username");
        String pgPass = env.getProperty("datasource.magic.password").replaceAll("!", "\\!");    /* ! is a shell metacharacter */

        message = createGpxConversionSchema(pgSchema);
        if (message.isEmpty()) {
            /* Successful schema creation - now construct ogr2ogr command to run to convert KML to PostGIS
             * example: 
             * ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=<schema> user=<user> password=<pass>' wright_pen_skidoo_track.kml 
             */
            try {
                String cmd = "ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=" + pgSchema + " user=" + pgUser + " password=" + pgPass + "' " + uploaded.getAbsolutePath();
                Process ogrProc = appRuntime.exec(cmd);
                int ogrProcRet = ogrProc.waitFor();
                /* Copy records from non-empty table into user uploads schema with a user-friendly name */

            } catch (IOException ioe) {
                message = "Failed to start conversion process from KML to PostGIS - error was " + ioe.getMessage();
            } catch (InterruptedException ie) {
                message = "Conversion from KML to PostGIS was interrupted - message was " + ie.getMessage();
            } catch (DataAccessException dae) {
                message = "Database error occurred during KML to PostGIS conversion - message was " + dae.getMessage();
            }
        }
        return (uploaded.getName() + ": " + message);
    }

    /**
     * Publishing workflow for uploaded CSV file
     * @param File uploaded
     * @param UploadedFileMetadata md
     * @return String
     */
    @Transactional
    private String publishCsv(File uploaded, UploadedFileMetadata md) {
        String message = "";
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
     * Create a new database schema to receive the tables created from the GPX file
     * @param String name
     * @return String
     */
    private String createGpxConversionSchema(String name) {
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
     * Extract feature-level metadata from information about the uploaded file
     * @param MultipartFile mpf 
     * @param String userName
     */
    private UploadedFileMetadata extractMetadata(MultipartFile mpf, String userName) {
        
        UploadedFileMetadata md = new UploadedFileMetadata();
        
        String basename = FilenameUtils.getBaseName(mpf.getOriginalFilename());
        String extension = FilenameUtils.getExtension(mpf.getOriginalFilename());
        String uploadDate = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss").format(new Date());
        
        md.setName(basename);
        md.setTitle(basename.replace("[^A-Za-z0-9]", " ").replace("\\s{2,}", " "));
        md.setDescription(extension.toUpperCase() + " file " +  mpf.getOriginalFilename() + " of size " + sizeFormatter(mpf.getSize()) + " uploaded on " + uploadDate + " by " + userName);
        md.setSrs("EPSG:4326");     /* Any different projection (shapefiles only) will be done in the appropriate place */
        
        return(md);
    }
    
    /**
     * Human-friendly file size
     * @param long filesize
     * @return String
     */
    private String sizeFormatter(long filesize) {
        if (filesize >= 1073741824) {
            return(Double.parseDouble(new DecimalFormat("#.##").format(filesize/1073741824)) + "GB");
        } else if (filesize >= 1048576) {
            return(Double.parseDouble(new DecimalFormat("#.##").format(filesize/1048576)) + "MB");
        } else if (filesize >= 1024) {
            return(Double.parseDouble(new DecimalFormat("#.#").format(filesize/1024)) + "KB");
        } else {
            return(filesize + " bytes");         
        }
    }
    
    public class UploadedFileMetadata {
        
        private String name;
        private String title;
        private String description;
        private String srs;
        
        public UploadedFileMetadata() {            
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getSrs() {
            return srs;
        }

        public void setSrs(String srs) {
            this.srs = srs;
        }
                        
    }

    public class ProcessWithTimeout extends Thread {

        private Process process;
        private int exitCode = Integer.MIN_VALUE;

        public ProcessWithTimeout(Process process) {
            this.process = process;
        }

        public int waitForProcess(long timeoutMilliseconds) {
            this.start();
            try {
                this.join(timeoutMilliseconds);
            } catch (InterruptedException ie) {
                this.interrupt();
            }
            return(exitCode);
        }

        @Override
        public void run() {
            try {
                exitCode = process.waitFor();
            } catch (InterruptedException ie) {
                /* Do nothing */
            } catch (Exception ex) {
                /* Unexpected exception */
            }
        }
    }

}
