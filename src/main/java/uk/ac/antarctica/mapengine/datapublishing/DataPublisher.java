/*
 * Abstract base class for data publication to Geoserver workflows
 */
package uk.ac.antarctica.mapengine.datapublishing;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import it.geosolutions.geoserver.rest.encoder.GSLayerEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.FeatureTypeAttribute;
import it.geosolutions.geoserver.rest.encoder.feature.GSAttributeEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.GSFeatureTypeEncoder;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import javax.servlet.ServletContext;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.ExecuteException;
import org.apache.commons.exec.ExecuteWatchdog;
import org.apache.commons.exec.PumpStreamHandler;
import org.apache.commons.exec.environment.EnvironmentUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uk.ac.antarctica.mapengine.model.UploadedData;
import uk.ac.antarctica.mapengine.model.UploadedFileMetadata;
import uk.ac.antarctica.mapengine.model.UploadedFileUserEnvironment;
import uk.ac.antarctica.mapengine.util.GeoserverRestEndpointConnector;

public abstract class DataPublisher {

    /* OS-specific directory path separator */
    protected static final String SEP = System.getProperty("file.separator");

    /* Upload temporary working directory base name */
    protected static final String WDBASE = System.getProperty("java.io.tmpdir") + SEP + "upload_";
    
    protected static final int MAX_TABLENAME_LENGTH = 50;
    
    protected static final int MAX_SCHEMANAME_LENGTH = 30;
        
    @Autowired
    private Environment env;

    @Autowired
    private JdbcTemplate magicDataTpl;
    
    @Autowired
    private JsonParser jsonParser;
    
    private ServletContext servletContext;   
    
    /* Map of PostgreSQL schema/credentials */
    private HashMap<String, String> pgMap = new HashMap();

    /* Access to OS level commands */
    private Runtime appRuntime = Runtime.getRuntime();

    public DataPublisher() {               
    }

    @Transactional
    public abstract void publish(UploadedData ud) throws GeoserverPublishException, IOException, DataAccessException;
    
    /**
     * Create the working environment to process a data file upload
     * @param ServletContext sc
     * @param MultipartFile mpf
     * @param parms
     * @param userName
     * @return UploadedFileMetadata
     * @throws IOException 
     */
    public UploadedData initWorkingEnvironment(ServletContext sc, MultipartFile mpf, Map<String, String[]> parms, String userName) 
        throws IOException, DataAccessException, MalformedURLException, GeoserverPublishException { 
        
        GeoserverRestEndpointConnector grec = new GeoserverRestEndpointConnector(null);
        
        setServletContext(sc);                
                
        if (getPgMap().isEmpty()) {
            /* PostgreSQL credentials */
            String passwd = getEnv().getProperty("datasource.magic.password");
            getPgMap().put("PGUSER", getEnv().getProperty("datasource.magic.username"));            
            if (!getEnv().getProperty("software.ogr2ogr").toLowerCase().contains("c:")) {
                passwd = passwd.replaceAll("!", "\\\\!");   /* ! is a shell metacharacter for UNIX */
            }
            getPgMap().put("PGPASS", passwd);
        }

        UploadedData ud = new UploadedData();
        ud.setUfmd(new UploadedFileMetadata());
        ud.setUfue(new UploadedFileUserEnvironment());    
        
        /* Check user upload schema exists in Postgres and create it if it doesn't */
        ud.getUfue().setUserName(userName);
        ud.getUfue().setUserPgSchema(createPgSchema(userName));
        
        /* Check user PostGIS store exposing the above schema exists, and create it if not */
        ud.getUfue().setUserDatastore(createPgSchemaDatastore(grec, ud.getUfue().getUserPgSchema()));        
        
        if (mpf == null) {
            /* No uploaded file data */
            ud.getUfmd().setUuid(getParameter("id", parms, ""));
            ud.getUfmd().setTitle(getParameter("caption", parms, ""));
            ud.getUfmd().setDescription(getParameter("description", parms, ""));
            ud.getUfmd().setAllowed_usage(getParameter("allowed_usage", parms, "public"));
            ud.getUfmd().setStyledef(getParameter("styledef", parms, "{\"mode\": \"default\"}"));
        } else {
            /* uploaded data */
            File wd = new File(WDBASE + Calendar.getInstance().getTimeInMillis());
            if (wd.mkdir()) {
                /* Created the temporary working directory, move the uploaded file there for conversion */
                File uploaded = new File(wd.getAbsolutePath() + SEP + standardiseName(mpf.getOriginalFilename(), true, -1));
                mpf.transferTo(uploaded);
                System.out.println("File transferred to : " + uploaded.getAbsolutePath());
                System.out.println("Is readable : " + (uploaded.canRead() ? "yes" : "no"));
                String basename = FilenameUtils.getBaseName(mpf.getOriginalFilename());
                ud.getUfmd().setUploaded(uploaded);
                ud.getUfmd().setUuid(getParameter("id", parms, ""));
                ud.getUfmd().setName(basename);
                ud.getUfmd().setTitle(getParameter("caption", parms, basename.replace("[^A-Za-z0-9]", " ").replace("\\s{2,}", " ")));
                ud.getUfmd().setDescription(getParameter("description", parms, 
                    FilenameUtils.getExtension(mpf.getOriginalFilename()).toUpperCase() + 
                        " file " + mpf.getOriginalFilename() + 
                        " of size " + sizeFormatter(mpf.getSize()) + 
                        " uploaded on " + new SimpleDateFormat("yyyy-MM-dd hh:mm:ss").format(new Date()) + 
                        " by " + userName));
                ud.getUfmd().setFiletype(FilenameUtils.getExtension(mpf.getOriginalFilename()).toLowerCase());
                ud.getUfmd().setAllowed_usage(getParameter("allowed_usage", parms, "public"));
                ud.getUfmd().setStyledef(getParameter("styledef", parms, "{\"mode\": \"default\"}"));
                ud.getUfmd().setSrs("EPSG:4326");     /* Any different projection (shapefiles only) will be done in the appropriate place */
            } else {
                /* Failed to create */
                throw new IOException("Failed to create working directory " + wd.getName());
            }  
        }        
        return(ud);
    }
    
    /**
     * Tear down the working environment
     * @param uploaded 
     */
    public void cleanUp(File uploaded) {
        FileUtils.deleteQuietly(uploaded.getParentFile());        
    }
        
    /**
     * Clear the GeowebCache cache for the given layer (needed when a style has been updated)
     * @param layerName 
     */
    public void clearCache(GeoserverRestEndpointConnector grec, String layerName) {
        System.out.println("Cache clear for layer " + layerName + " " + 
            (grec.deleteContent("gwc/rest/layers/" + layerName) != null ? "successful": "failed")
        );       
        /* Reload Geoserver catalogue */
        System.out.println("Reloading catalogue " + (grec.getContent("reload") != null ? "successful" : "failed"));  
    }
    
    /**
     * Recover the passed-in parameter, assigning a suitable default
     * @param name
     * @param parms
     * @param defaultVal
     * @return 
     */
    protected String getParameter(String name, Map<String, String[]> parms, String defaultVal) {
        String parmVal;
        String[] parmVals = parms.get(name);
        if (parmVals != null && parmVals.length > 0) {
            parmVal = (parmVals[0] != null && !parmVals[0].isEmpty()) ? parmVals[0] : defaultVal;
        } else {
            parmVal = defaultVal;
        }
        return(parmVal);
    }
    
    /**
     * Create the named schema (a temporary UUID-named one if the input is null)
     * @param fromName 
     * @return the name of the created schema
     */
    protected String createPgSchema(String fromName) throws DataAccessException {
        if (fromName == null || fromName.isEmpty()) {
            fromName = "temp_" + UUID.randomUUID().toString();
        }
        /* Replace all non-lowercase alphanumerics with _ and truncate maximum allowed length */
        String schemaName = "user_" + standardiseName(fromName, false, MAX_SCHEMANAME_LENGTH);        
        getMagicDataTpl().execute("CREATE SCHEMA IF NOT EXISTS " + schemaName + " AUTHORIZATION " + getEnv().getProperty("datasource.magic.username"));
        return(schemaName);
    }
    
    /**
     * Drop a database schema
     * @param schemaName
     */
    protected void deletePgSchema(String schemaName) throws DataAccessException {
        if (schemaName != null && !schemaName.isEmpty()) {
            getMagicDataTpl().execute("DROP SCHEMA IF EXISTS " + schemaName + " CASCADE");
        }
    }   
    
    /**
     * Create a Geoserver PostGIS datastore of the given name in the global user workspace
     * @param schemaName 
     * @return the datastore name
     */
    protected String createPgSchemaDatastore(GeoserverRestEndpointConnector grec, String schemaName) throws GeoserverPublishException {
        JsonObject joDs = new JsonObject();
        joDs.addProperty("name", schemaName);
        JsonObject joConn = new JsonObject();
        JsonArray jaEntry = new JsonArray();
        /* Add entries */
        jaEntry.add(pgConnectionParameter("host", "localhost"));
        jaEntry.add(pgConnectionParameter("port", "5432"));
        jaEntry.add(pgConnectionParameter("database", "magic"));
        jaEntry.add(pgConnectionParameter("user", getEnv().getProperty("datasource.magic.username")));
        jaEntry.add(pgConnectionParameter("passwd", getEnv().getProperty("datasource.magic.password")));
        jaEntry.add(pgConnectionParameter("schema", schemaName));
        jaEntry.add(pgConnectionParameter("min connections", "1"));
        jaEntry.add(pgConnectionParameter("max connections", "10"));
        jaEntry.add(pgConnectionParameter("fetch size", "1000"));
        jaEntry.add(pgConnectionParameter("Expose primary keys", "true"));
        jaEntry.add(pgConnectionParameter("Connection timeout", "20"));
        jaEntry.add(pgConnectionParameter("validate connections", "true"));
        jaEntry.add(pgConnectionParameter("Max open prepared statements", "50"));
        joConn.add("entry", jaEntry);
        joDs.add("connectionParameters", joConn);
        JsonObject data = new JsonObject();
        data.add("dataStore", joDs);
        if (grec.postJson("workspaces/" + getEnv().getProperty("geoserver.internal.userWorkspace") + "/datastores", data.toString()) == null) {
            throw new GeoserverPublishException("Failed to create PostGIS user store " + schemaName + " for service at " + grec.getUrl());
        }
        return(schemaName);
    } 
    
    /**
     * Create a key/value pair entry in the Geoserver REST approved format
     * @param key
     * @param value
     * @return 
     */
    protected JsonObject pgConnectionParameter(String key, String value) {
        JsonObject jo = new JsonObject();
        jo.addProperty("@key", key);
        jo.addProperty("$", value);
        return(jo);
    }
    
    /**
     * Create a style based on the user's requirements
     * @param grec
     * @param schemaName
     * @param tableName
     * @param styledef
     * @param exStyleFile
     * @return style name
     */
    protected String createLayerStyling(GeoserverRestEndpointConnector grec, String schemaName, String tableName, String styledef, File exStyleFile) throws IOException, FileNotFoundException{        
        JsonElement jesd = jsonParser.parse(styledef);
        JsonObject josd = jesd.getAsJsonObject();
        String mode = !josd.has("mode") ? "default" : josd.get("mode").getAsString();
        String geomType = getGeometryType(schemaName + "." + tableName);
        String styleName = null;
        boolean stylePublished = false;
        System.out.println("Styling mode " + mode);
        switch(mode) {
            case "file":
                /* Style is in file supplied (shapefile), or internal to the file (GPX/KML) when exStyleFile is null */
                if (exStyleFile != null) {
                    String userWs = getEnv().getProperty("geoserver.internal.userWorkspace");
                    String exInfo = grec.getContent("workspaces/" + userWs + "/styles/" + tableName);
                    if (exInfo.toLowerCase().startsWith("no such style")) {
                        /* Style does not currently exist */
                        System.out.println("Style " + tableName + " not present");
                        String publishRes = grec.postJson("workspaces/" + userWs + "/styles", packageStyle(tableName, exStyleFile));
                        System.out.println("Created ok " + (publishRes != null ? "yes" : "no"));
                    } else {
                        /* Existing style */
                        System.out.println("Style " + tableName + " exists");
                        String publishRes = grec.putContent("workspaces/" + userWs + "/styles/" + tableName, packageStyle(tableName, exStyleFile));
                        System.out.println("Modified ok " + (publishRes != null ? "yes" : "no"));
                    }                    
                }      
                break;
            case "point":
            case "line":
            case "polygon":
                String graphicMarker = "circle", graphicRadius = "5";
                String strokeWidth = "1", strokeColor = "#000000", strokeOpacity = "1.0", strokeLinestyle = "solid";
                String fillColor = "#ffffff", fillOpacity = "1.0";
                if (josd.has("graphic")) {
                    JsonObject graphic = josd.get("graphic").getAsJsonObject();
                    if (graphic.has("marker")) {
                        graphicMarker = graphic.get("marker").getAsString();
                    }
                    if (graphic.has("radius")) {
                        graphicRadius = graphic.get("radius").getAsString();
                    }
                } else {
                    /* Legacy format for styles */
                    if (josd.has("marker")) {
                        graphicMarker = josd.get("marker").getAsString();
                    }
                    if (josd.has("radius")) {
                        graphicRadius = josd.get("radius").getAsString();
                    }
                }
                if (josd.has("stroke")) {
                    JsonObject stroke = josd.get("stroke").getAsJsonObject();
                    if (stroke.has("width")) {
                        strokeWidth = stroke.get("width").getAsString();
                    }
                    if (stroke.has("color")) {
                        strokeColor = stroke.get("color").getAsString();
                    }
                    if (stroke.has("opacity")) {
                        strokeOpacity = stroke.get("opacity").getAsString();
                    }
                    if (stroke.has("linestyle")) {
                        strokeLinestyle = getDashArray(stroke.get("linestyle").getAsString());
                    }
                } else {
                    /* Legacy format for styles */
                    if (josd.has("stroke_width")) {
                        strokeWidth = josd.get("stroke_width").getAsString();
                    }
                    if (josd.has("stroke_color")) {
                        strokeColor = josd.get("stroke_color").getAsString();
                    }
                    if (josd.has("stroke_opacity")) {
                        strokeOpacity = josd.get("stroke_opacity").getAsString();
                    }
                    if (josd.has("stroke_linestyle")) {
                        strokeLinestyle = getDashArray(josd.get("stroke_linestyle").getAsString());
                    }
                }
                if (josd.has("fill")) {
                    JsonObject fill = josd.get("fill").getAsJsonObject();
                    if (fill.has("color")) {
                        fillColor = fill.get("color").getAsString();
                    }
                    if (fill.has("opacity")) {
                        fillOpacity = fill.get("opacity").getAsString();
                    }
                } else {
                    /* Legacy format for styles */
                    if (josd.has("fill_color")) {
                        fillColor = josd.get("fill_color").getAsString();
                    }
                    if (josd.has("fill_opacity")) {
                        fillOpacity = josd.get("fill_opacity").getAsString();
                    }
                }
                String sldOut = StringUtils.replaceEachRepeatedly(
                    FileUtils.readFileToString(new File(getServletContext().getRealPath("/WEB-INF/sld/" + geomType + ".xml"))),
                    new String[]{"{marker}", "{radius}", "{fill_color}", "{fill_opacity}", "{stroke_width}", "{stroke_color}", "{stroke_opacity}", "{stroke_linestyle}"}, 
                    new String[]{graphicMarker, graphicRadius, fillColor, fillOpacity, strokeWidth, strokeColor, strokeOpacity, strokeLinestyle}
                ); 
                System.out.println("Writing SLD...");
                System.out.println(sldOut);
                System.out.println("End of SLD");
                String userWs = getEnv().getProperty("geoserver.internal.userWorkspace");
                String exInfo = grec.getContent("workspaces/" + userWs + "/styles/" + tableName);
                if (exInfo.toLowerCase().startsWith("no such style")) {
                    /* Style does not currently exist */
                    System.out.println("Style " + tableName + " not present");
                    String publishRes = grec.postContent("workspaces/" + userWs + "/styles?name=" + tableName, sldOut, "application/vnd.ogc.sld+xml");
                    System.out.println("Created ok " + (publishRes != null ? "yes" : "no"));
                } else {
                    /* Existing style */
                    System.out.println("Style " + tableName + " exists");
                    String publishRes = grec.putContent("workspaces/" + userWs + "/styles/" + tableName, sldOut, "application/vnd.ogc.sld+xml");
                    System.out.println("Modified ok " + (publishRes != null ? "yes" : "no"));
                }                                      
                break;            
            default:
                break;
        }
        if (stylePublished) {
            styleName = tableName;
        }
        return(styleName);
    }
    
    /**
     * Package style in a JSON form suitable for POST/PUT to Geoserver REST API
     * @param name
     * @param sld
     * @return 
     */
    protected String packageStyle(String name, File sld) {
        JsonObject jo =  new JsonObject();
        jo.addProperty("name", name);
        jo.addProperty("filename", sld.getAbsolutePath());
        return(jo.toString());
    }
    
    /**
     * Style translation for human-friendly line symbology
     * @param lineStyle solid|dotted|dashed|dotted-dashed
     * @return
     */
    protected String getDashArray(String lineStyle) {
        String dashArray = "";
        if (lineStyle != null && !lineStyle.equals("solid")) {
            String arr = null;
            switch(lineStyle) {
                case "dotted": arr = "2 2"; break;
                case "dashed": arr = "5 2"; break;
                case "dotted-dashed": arr = "4 2 1 2"; break;
                default: break;
            }
            if (arr != null) {
                dashArray = "<CssParameter name=\"stroke-dasharray\">" + arr + "</CssParameter>";
            }
        }
        return(dashArray);
    }
    
    /**
     * Unzip the given file into the same directory
     * @param zip 
     */
    protected void unzipFile(File zip) throws FileNotFoundException, IOException {
        String workDir = zip.getParent();
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zip))) {
            ZipEntry ze = zis.getNextEntry();
            while(ze != null) {
                File f = new File(workDir + SEP + ze.getName());
                try (FileOutputStream fos = new FileOutputStream(f)) {
                    int len;
                    byte buffer[] = new byte[1024];
                    while ((len = zis.read(buffer)) > 0) {
                        fos.write(buffer, 0, len);
                    }
                }
                ze = zis.getNextEntry();
            }
            zis.closeEntry();
        }
    }
    
    /**
     * Get geometry type (point|line|polygon) for the given table
     * @param tableName
     * @return
     */
    protected String getGeometryType(String tableName) throws DataAccessException {
        String type = "point";
        String pgType = getMagicDataTpl().queryForObject("SELECT ST_GeometryType(wkb_geometry) FROM " + tableName + " LIMIT 1", String.class).toLowerCase();
        if (pgType.contains("line")) {
            type = "line";
        } else if (pgType.contains("polygon")) {
            type = "polygon";
        }
        return (type);
    }
    
    /**
     * Import the given file data into a single PostGIS table via a commandline call to ogr2ogr
     * Note: if the ogr2ogr call will result in multiple tables of defined name, tableName can be null and a containing schema name supplied instead
     * @param toConvert  
     * @param tableName
     * @param tableSchema
     * @throws ExecuteException 
     */
    protected void executeOgr2ogr(File toConvert, String tableName, String tableSchema) throws ExecuteException {
        getPgMap().put("PGSCHEMA", tableSchema);     
        getPgMap().put("TOCONVERT", toConvert.getAbsolutePath());       
        CommandLine ogr2ogr = new CommandLine(getEnv().getProperty("software.ogr2ogr"));
        ogr2ogr.setSubstitutionMap(getPgMap());
        ogr2ogr.addArgument("-t_srs", false);
        ogr2ogr.addArgument("EPSG:4326", false);
        ogr2ogr.addArgument("-overwrite", false);
        ogr2ogr.addArgument("-f", false);        
        ogr2ogr.addArgument("PostgreSQL", false);
        /* Don't really understand why Linux wants this string UNQUOTED as it has spaces in it - all the examples do, however if you quote it it looks like ogr2ogr
         * attempts to create the database which it doesn't have the privileges to do */
        ogr2ogr.addArgument("PG:host=localhost dbname=magic schemas=${PGSCHEMA} user=${PGUSER} password=${PGPASS}", false);
        ogr2ogr.addArgument("${TOCONVERT}", toConvert.getAbsolutePath().endsWith(".gpx"));
        if (tableName != null) {
            /* Strip schema name if present */
            ogr2ogr.addArgument("-nln");
            ogr2ogr.addArgument(tableName.substring(tableName.indexOf(".")+1));
        }
        System.out.println("Executing ogr commandline : " + ogr2ogr.toString());
        DefaultExecutor executor = new DefaultExecutor();
        /* Send stdout and stderr to specific byte arrays so that the end user will get some feedback about the problem */
        ByteArrayOutputStream ogrStdout = new ByteArrayOutputStream();
        ByteArrayOutputStream ogrStderr = new ByteArrayOutputStream();
        PumpStreamHandler pumpStreamHandler = new PumpStreamHandler(ogrStdout, ogrStderr);
        executor.setStreamHandler(pumpStreamHandler);
        executor.setExitValue(0);
        ExecuteWatchdog watchdog = new ExecuteWatchdog(30000);  /* Time process out after 30 seconds */
        executor.setWatchdog(watchdog);
        int exitValue = -1;
        try {         
            Map executionEnv = EnvironmentUtils.getProcEnvironment();
            boolean overrideLibraryPath = 
                getEnv().getProperty("software.ld_library_path_override") != null && 
                getEnv().getProperty("software.ld_library_path_override").equals("yes");
            if (overrideLibraryPath) {
                executionEnv.remove("LD_LIBRARY_PATH");
            }
            executionEnv.put("GDAL_DATA", getEnv().getProperty("software.gdal_data"));
            executor.execute(ogr2ogr, executionEnv);
        } catch (IOException ex) {
            /* Report what ogr2ogr wrote to stderr (may use the stdout output too at some point) */
            throw new ExecuteException("Error converting file : " + new String(ogrStderr.toByteArray(), StandardCharsets.UTF_8), exitValue);
        }
    }
        
    /**
     * Unpublish an existing dataset by deleting it from PostGIS, unpublishing from Geoserver and deleting it from userlayers
     * @param grec
     * @param uuid
     * @param dataStore
     * @param tableSchema
     * @param tableName 
     */
    protected void removeExistingData(GeoserverRestEndpointConnector grec, String uuid, String dataStore, String tableSchema, String tableName) throws DataAccessException, GeoserverPublishException {
        
        System.out.println("Entered removeExistingData()");
        
        /* Drop any Geoserver feature corresponding to this table */
        String userWs = getEnv().getProperty("geoserver.internal.userWorkspace");
        String exInfo = grec.getContent("workspaces/" + userWs + "/datastores/" + dataStore + "/featuretypes/" + tableName);
        if (!exInfo.toLowerCase().startsWith("no such feature")) {
            System.out.println("Unpublishing existing feature " + tableName + "...");
            System.out.println((grec.deleteContent("workspaces/" + userWs + "/datastores/" + dataStore + "/featuretypes/" + tableName) == null) ? "Failed" : "Success");
        }       
        /* Drop any Geoserver style relating to the table */
        String exStyleInfo = grec.getContent("workspaces/" + userWs + "/styles/" + tableName);
        if (!exStyleInfo.toLowerCase().startsWith("no such style")) {
            /* Style does not currently exist */
            System.out.println("Deleting associated style " + tableName + "...");
            System.out.println((grec.deleteContent("workspaces/" + userWs + "/styles/" + tableName) == null) ? "Failed" : "Success");
        }       
        /* Drop the existing table, including any sequence and index previously created by ogr2ogr */
        System.out.println("Drop underlying PostGIS table " + tableSchema + "." + tableName + "...");
        getMagicDataTpl().execute("DROP TABLE IF EXISTS " + tableSchema + "." + tableName + " CASCADE");
        System.out.println("Done");
        /* Drop any record of this feature in the user features table */
        System.out.println("Delete layer from userlayers table...");
        getMagicDataTpl().update("DELETE FROM " + getEnv().getProperty("postgres.local.userlayersTable") + " WHERE id=?", uuid);
        System.out.println("Done");        
        System.out.println("Exited removeExistingData()");
    }
    
    /**
     * Insert/update record into the userlayers table
     * @param ud 
     */
    protected void updateUserlayersRecord(UploadedData ud) throws DataAccessException, FileNotFoundException, IOException {
        String uuid = ud.getUfmd().getUuid();
        if (uuid == null || uuid.equals("")) {
            /* This is an insert */
            getMagicDataTpl().update("INSERT INTO " + getEnv().getProperty("postgres.local.userlayersTable") + " " + 
                "VALUES(?,?,?,?,?,?,?,?,?,current_timestamp,current_timestamp,?,?)", 
                new Object[] {
                    UUID.randomUUID().toString(),
                    ud.getUfmd().getTitle(),
                    ud.getUfmd().getDescription(),
                    IOUtils.toByteArray(new FileInputStream(ud.getUfmd().getUploaded())),
                    ud.getUfmd().getFiletype(),
                    getEnv().getProperty("geoserver.internal.url") + "/" + getEnv().getProperty("geoserver.internal.userWorkspace") + "/wms",
                    ud.getUfue().getUserDatastore(),
                    ud.getUfue().getUserPgLayer(),
                    ud.getUfue().getUserName(),
                    ud.getUfmd().getAllowed_usage(),
                    getJsonDataAsPgObject(ud.getUfmd().getStyledef())
                });
        } else {
            /* This is an update of an existing record */
            getMagicDataTpl().update("UPDATE " + getEnv().getProperty("postgres.local.userlayersTable") + " " + 
                "SET caption=?,description=?,upload=?,filetype=?,store=?,layer=?,modified_date=current_timestamp,allowed_usage=?,styledef=? WHERE id=?", 
                new Object[] {
                    ud.getUfmd().getTitle(),
                    ud.getUfmd().getDescription(),
                    IOUtils.toByteArray(new FileInputStream(ud.getUfmd().getUploaded())),
                    ud.getUfmd().getFiletype(),
                    ud.getUfue().getUserDatastore(),
                    ud.getUfue().getUserPgLayer(),
                    ud.getUfmd().getAllowed_usage(),
                    getJsonDataAsPgObject(ud.getUfmd().getStyledef()),
                    ud.getUfmd().getUuid()
                });
        }
    }
    
    protected PGobject getJsonDataAsPgObject(String value) {
        /* A bit of "cargo-cult" programming from https://github.com/denishpatel/java/blob/master/PgJSONExample.java - what a palaver! */
        PGobject dataObject = new PGobject();
        dataObject.setType("json");
        try {
            dataObject.setValue(value);
        } catch (SQLException ex) {            
        }
        return(dataObject);
    }
    
    /**
     * Publish a PostGIS table as a Geoserver layer using the REST API
     * @param grec
     * @param dataStore
     * @param md
     * @param tableName
     * @param defaultStyle
     * @return 
     */
    protected boolean publishPgLayer(GeoserverRestEndpointConnector grec, String dataStore, UploadedFileMetadata md, String tableName, String defaultStyle) {
        boolean ret = false;
        
        String tsch = tableName.substring(0, tableName.indexOf("."));
        String tname = tableName.substring(tableName.indexOf(".") + 1);
        
        JsonObject layerData = new JsonObject();
        layerData.addProperty("name", tname);
        layerData.addProperty("title", md.getTitle());
        layerData.addProperty("abstract", md.getDescription());
        layerData.addProperty("nativeCRS", md.getSrs());
        layerData.addProperty("srs", md.getSrs());
        
        return(ret);
    }
    
    /**
     * Update a published Geoserver layer using the REST API
     * @param grec
     * @param layerName
     * @param defaultStyle
     * @return 
     */
    protected boolean updatePgLayer(GeoserverRestEndpointConnector grec, String layerName, String defaultStyle) {
        boolean ret = false;
        
        return(ret);
    }
    
    /**
     * Construct the attribute map for Geoserver Manager for <schema>.<table>
     * @param  md
     * @param destTableName
     * @return
     */
    protected GSFeatureTypeEncoder configureFeatureType(UploadedFileMetadata md, String destTableName) throws DataAccessException {

        GSFeatureTypeEncoder gsfte = new GSFeatureTypeEncoder();
        String tsch = destTableName.substring(0, destTableName.indexOf("."));
        String tname = destTableName.substring(destTableName.indexOf(".") + 1);
        
        /* Now set feature metadata */
        gsfte.setNativeCRS(md.getSrs());
        gsfte.setSRS(md.getSrs());
        gsfte.setName(tname);
        gsfte.setTitle(md.getTitle());
        gsfte.setAbstract(md.getDescription());

        List<Map<String, Object>> recs = getMagicDataTpl().queryForList(
                "SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema=? AND table_name=?", 
                tsch, tname
        );
        if (!recs.isEmpty()) {
            for (Map<String, Object> rec : recs) {
                /* Create Geoserver Manager's configuration */
                String colName = (String) rec.get("column_name");
                String isNillable = (String) rec.get("is_nullable");
                String dataType = getDataTypeBinding((String) rec.get("data_type"));
                GSAttributeEncoder attribute = new GSAttributeEncoder();
                attribute.setAttribute(FeatureTypeAttribute.name, colName);
                attribute.setAttribute(FeatureTypeAttribute.minOccurs, String.valueOf(0));
                attribute.setAttribute(FeatureTypeAttribute.maxOccurs, String.valueOf(1));
                attribute.setAttribute(FeatureTypeAttribute.nillable, String.valueOf(isNillable.toLowerCase().equals("yes")));
                attribute.setAttribute(FeatureTypeAttribute.binding, dataType);
                gsfte.setAttribute(attribute);                              
            }
        }        
        return (gsfte);
    }

    /**
     * Construct layer configurator for Geoserver Manager
     * @param defaultStyle
     * @return
     */
    protected GSLayerEncoder configureLayerData(String defaultStyle) {
        GSLayerEncoder gsle = new GSLayerEncoder();
        if (defaultStyle != null) {
            gsle.setDefaultStyle(defaultStyle);
        }
        gsle.setEnabled(true);
        gsle.setQueryable(true);
        return (gsle);
    }

    /**
     * Translate a PostgreSQL data type into a Java class binding (very simple,
     * may need to be extended if lots of other types come up)
     * @param pgType
     * @return
     */
    protected String getDataTypeBinding(String pgType) {
        String jType;
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
     * Create a standardised name for a file/table/schema - done by lowercasing,
     * converting all non-alphanumerics to _ and sequences of _ to single _
     * @param name
     * @param allowDot - allow a single period to delimit the suffix in a filename
     * @param lengthLimit - maximum string length, -1 to allow any
     * @return
     */
    protected String standardiseName(String name, boolean allowDot, int lengthLimit) {
        String stdName = "";
        if (name != null && !name.isEmpty()) {
            stdName = name.toLowerCase().replaceAll(allowDot ? "[^a-z0-9.]" : "[^a-z0-9]", "_").replaceAll("_{2,}", "_").replaceFirst("_$", "");
            if (allowDot) {
                int lastDot = stdName.lastIndexOf(".");
                stdName = stdName.substring(0, lastDot).replaceAll("\\.", "_") + stdName.substring(lastDot);
            }
            if (Character.isDigit(stdName.charAt(0))) {
                /* Disallow an initial digit, bad for PostGIS and Geoserver */
                stdName = "x" + stdName;
            }
            if (lengthLimit > 0 && stdName.length() > lengthLimit) {
                stdName = stdName.substring(0, lengthLimit);
            }
        }
        return (stdName);
    }

    /**
     * Human-friendly file size
     * @param filesize
     * @return
     */
    protected String sizeFormatter(long filesize) {
        if (filesize >= 1073741824) {
            return (Double.parseDouble(new DecimalFormat("#.##").format(filesize / 1073741824)) + "GB");
        } else if (filesize >= 1048576) {
            return (Double.parseDouble(new DecimalFormat("#.##").format(filesize / 1048576)) + "MB");
        } else if (filesize >= 1024) {
            return (Double.parseDouble(new DecimalFormat("#.#").format(filesize / 1024)) + "KB");
        } else {
            return (filesize + " bytes");
        }
    }
    
    protected String dateTimeSuffix() {
        return(new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));
    }

    public final Environment getEnv() {
        return env;
    }

    public void setEnv(Environment env) {
        this.env = env;
    }

    public JdbcTemplate getMagicDataTpl() {
        return magicDataTpl;
    }

    public void setMagicDataTpl(JdbcTemplate magicDataTpl) {
        this.magicDataTpl = magicDataTpl;
    }
    
    public final HashMap<String, String> getPgMap() {
        return pgMap;
    }
    
    public void setPgMap(HashMap<String, String> pgMap) {
        this.pgMap = pgMap;
    }
        
    public ServletContext getServletContext() {
        return servletContext;
    }

    public void setServletContext(ServletContext servletContext) {
        this.servletContext = servletContext;
    }

    public Runtime getAppRuntime() {
        return appRuntime;
    }

    public void setAppRuntime(Runtime appRuntime) {
        this.appRuntime = appRuntime;
    }
    
    public class GeoserverPublishException extends Exception {
        public GeoserverPublishException(String message) {
            super(message);
        }
    }

}
