/*
 * Abstract base class for data publication to Geoserver workflows
 */
package uk.ac.antarctica.mapengine.datapublishing;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import it.geosolutions.geoserver.rest.GeoServerRESTManager;
import it.geosolutions.geoserver.rest.decoder.RESTDataStore;
import it.geosolutions.geoserver.rest.encoder.GSLayerEncoder;
import it.geosolutions.geoserver.rest.encoder.datastore.GSPostGISDatastoreEncoder;
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
import java.net.URL;
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
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
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

public abstract class DataPublisher {

    /* OS-specific directory path separator */
    protected static final String SEP = System.getProperty("file.separator");

    /* Upload temporary working directory base name */
    protected static final String WDBASE = System.getProperty("java.io.tmpdir") + SEP + "upload_";
        
    @Autowired
    private Environment env;

    @Autowired
    private JdbcTemplate magicDataTpl;
    
    private ServletContext servletContext;
    
    /* Single endpoint for all Geoserver Manager functionality */
    private GeoServerRESTManager grm = null;
    
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
     * @param Map<String, String[]> parms
     * @param String userName
     * @return UploadedFileMetadata
     * @throws IOException 
     */
    public UploadedData initWorkingEnvironment(ServletContext sc, MultipartFile mpf, Map<String, String[]> parms, String userName) 
        throws IOException, DataAccessException, MalformedURLException, GeoserverPublishException {   
        
        setServletContext(sc);
        
        if (getGrm() == null) {
            /* Create Geoserver store manager */
            setGrm(new GeoServerRESTManager(
                new URL(getEnv().getProperty("geoserver.local.url")), 
                getEnv().getProperty("geoserver.local.username"), 
                getEnv().getProperty("geoserver.local.password")
            ));
        }
                
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
        ud.getUfue().setUserDatastore(createPgSchemaDatastore(ud.getUfue().getUserPgSchema()));        
        
        File wd = new File(WDBASE + Calendar.getInstance().getTimeInMillis());
        if (wd.mkdir()) {
            /* Created the tempotary working directory, move the uploaded file there for conversion */
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
            ud.getUfmd().setStyledef(getParameter("styledef", parms, "{\"mode\": \"auto\"}"));
            ud.getUfmd().setSrs("EPSG:4326");     /* Any different projection (shapefiles only) will be done in the appropriate place */
        } else {
            /* Failed to create */
            throw new IOException("Failed to create working directory " + wd.getName());
        }  
        return(ud);
    }
    
    /**
     * Tear down the working environment
     * @param File uploaded 
     */
    public void cleanUp(File uploaded) {
        FileUtils.deleteQuietly(uploaded.getParentFile());        
    }
    
    /**
     * Recover the passed-in parameter, assigning a suitable default
     * @param String name
     * @param Map<String, String[]> parms
     * @param String defaultVal
     * @return String 
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
     * @param String fromName 
     * @return String the name of the created schema
     */
    protected String createPgSchema(String fromName) throws DataAccessException {
        if (fromName == null || fromName.isEmpty()) {
            fromName = "temp_" + UUID.randomUUID().toString();
        }
        /* Replace all non-lowercase alphanumerics with _ and truncate to 30 characters */
        String schemaName = "user_" + standardiseName(fromName, false, 30);        
        getMagicDataTpl().execute("CREATE SCHEMA IF NOT EXISTS " + schemaName + " AUTHORIZATION " + getEnv().getProperty("datasource.magic.username"));
        return(schemaName);
    }
    
    /**
     * Drop a database schema
     * @param String schemaName
     */
    protected void deletePgSchema(String schemaName) throws DataAccessException {
        if (schemaName != null && !schemaName.isEmpty()) {
            getMagicDataTpl().execute("DROP SCHEMA IF EXISTS " + schemaName + " CASCADE");
        }
    }   
    
    /**
     * Create a Geoserver PostGIS datastore of the given name in the global user workspace
     * @param String schemaName 
     * @return String the datastore name
     */
    protected String createPgSchemaDatastore(String schemaName) throws GeoserverPublishException {
        String ws = getEnv().getProperty("geoserver.local.userWorkspace");
        RESTDataStore rds = getGrm().getReader().getDatastore(ws, schemaName);
        if (rds == null) {
            GSPostGISDatastoreEncoder dse = new GSPostGISDatastoreEncoder(schemaName);
            dse.setHost("localhost");
            dse.setPort(5432);
            dse.setDatabase("magic");
            dse.setUser(getEnv().getProperty("datasource.magic.username"));
            dse.setPassword(getEnv().getProperty("datasource.magic.password"));
            dse.setSchema(schemaName);
            dse.setMaxConnections(10);
            dse.setMinConnections(1);
            dse.setFetchSize(1000);
            dse.setExposePrimaryKeys(true);
            dse.setConnectionTimeout(20);
            dse.setValidateConnections(true);
            dse.setMaxOpenPreparedStatements(50);
            if (!getGrm().getStoreManager().create(ws, dse)) {
                throw new GeoserverPublishException("Failed to create PostGIS user store");
            }
        }
        return(schemaName);
    } 
    
    /**
     * Create a style based on the user's requirements
     * @param String schemaName
     * @param String tableName
     * @param String styledef
     * @param File exStyleFile
     * @return String style name
     */
    protected String createLayerStyling(String schemaName, String tableName, String styledef, File exStyleFile) throws IOException, FileNotFoundException{        
        JsonElement jesd = new JsonParser().parse(styledef);
        JsonObject josd = jesd.getAsJsonObject();
        String mode = !josd.has("mode") ? "default" : josd.get("mode").getAsString();
        String geomType = getGeometryType(schemaName + "." + tableName);
        String styleName = geomType;
        switch(mode) {
            case "file":
                /* Style is in file supplied (shapefile), or internal to the file (GPX/KML) when exStyleFile is null */
                if (exStyleFile != null && getGrm().getPublisher().publishStyleInWorkspace(getEnv().getProperty("geoserver.local.userWorkspace"), exStyleFile, tableName)) {
                    styleName = tableName;
                }                
                break;
            case "point":
                if (geomType.equals("point")) {
                    String genSld = getServletContext().getContextPath() + "/WEB-INF/sld/point.xml";
                    String content = FileUtils.readFileToString(new File(genSld));
                    String sldOut = StringUtils.replaceEachRepeatedly(
                        content, 
                        new String[]{"{marker}", "{radius}", "{fill_color}", "fill_opacity}", "{stroke_width}", "{stroke_color}", "{stroke_opacity}"}, 
                        new String[]{
                            josd.has("marker") ? josd.get("marker").getAsString() : "circle",
                            josd.has("radius") ? josd.get("radius").getAsString() : "5",
                            josd.has("fill_color") ? josd.get("fill_color").getAsString() : "#ffffff",
                            josd.has("fill_opacity") ? josd.get("fill_opacity").getAsString() : "1.0",
                            josd.has("stroke_width") ? josd.get("stroke_width").getAsString() : "1",
                            josd.has("stroke_color") ? josd.get("stroke_color").getAsString() : "#000000",
                            josd.has("stroke_opacity") ? josd.get("stroke_opacity").getAsString() : "1.0"
                        });
                    if (getGrm().getPublisher().publishStyleInWorkspace(getEnv().getProperty("geoserver.local.userWorkspace"), sldOut, tableName)) {
                        styleName = tableName;
                    }
                }
                break;
            case "line":
                if (geomType.equals("line")) {
                    String genSld = getServletContext().getContextPath() + "/WEB-INF/sld/line.xml";
                    String content = FileUtils.readFileToString(new File(genSld));
                    String sldOut = StringUtils.replaceEachRepeatedly(
                        content, 
                        new String[]{"{stroke_width}", "{stroke_color}", "{stroke_opacity}", "{stroke_linestyle}"}, 
                        new String[]{                            
                            josd.has("stroke_width") ? josd.get("stroke_width").getAsString() : "1",
                            josd.has("stroke_color") ? josd.get("stroke_color").getAsString() : "#000000",
                            josd.has("stroke_opacity") ? josd.get("stroke_opacity").getAsString() : "1.0",
                            josd.has("stroke_linestyle") ? getDashArray(josd.get("stroke_linestyle").getAsString()) : ""
                        });
                    if (getGrm().getPublisher().publishStyleInWorkspace(getEnv().getProperty("geoserver.local.userWorkspace"), sldOut, tableName)) {
                        styleName = tableName;
                    }
                }
                break;
            case "polygon":
                if (geomType.equals("polygon")) {
                    String genSld = getServletContext().getContextPath() + "/WEB-INF/sld/polygon.xml";
                    String content = FileUtils.readFileToString(new File(genSld));
                    String sldOut = StringUtils.replaceEachRepeatedly(
                        content, 
                        new String[]{"{fill_color}", "fill_opacity}", "{stroke_width}", "{stroke_color}", "{stroke_opacity}"}, 
                        new String[]{                            
                            josd.has("fill_color") ? josd.get("fill_color").getAsString() : "#ffffff",
                            josd.has("fill_opacity") ? josd.get("fill_opacity").getAsString() : "1.0",
                            josd.has("stroke_width") ? josd.get("stroke_width").getAsString() : "1",
                            josd.has("stroke_color") ? josd.get("stroke_color").getAsString() : "#000000",
                            josd.has("stroke_opacity") ? josd.get("stroke_opacity").getAsString() : "1.0"
                        });
                    if (getGrm().getPublisher().publishStyleInWorkspace(getEnv().getProperty("geoserver.local.userWorkspace"), sldOut, tableName)) {
                        styleName = tableName;
                    }
                }
                break;
            default:
                break;
        }
        return(styleName);
    }
    
    /**
     * Style translation for human-friendly line symbology
     * @param Sting lineStyle solid|dotted|dashed|dotted-dashed
     * @return String
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
     * @param File zip 
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
     * @param String tableName
     * @return String
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
     * @param File toConvert  
     * @param String tableName
     * @param String tableSchema
     * @throws ExecuteException 
     */
    protected void executeOgr2ogr(File toConvert, String tableName, String tableSchema) throws ExecuteException {
        getPgMap().put("PGSCHEMA", tableSchema);     
        getPgMap().put("TOCONVERT", toConvert.getAbsolutePath());       
        CommandLine ogr2ogr = new CommandLine(getEnv().getProperty("software.ogr2ogr"));
        ogr2ogr.setSubstitutionMap(getPgMap());
        ogr2ogr.addArgument("-overwrite", false);
        ogr2ogr.addArgument("-f", false);        
        ogr2ogr.addArgument("PostgreSQL", false);
        /* Don't really understand why Linux wants this string UNQUOTED as it has spaces in it - all the examples do, however if you quote it it looks like ogr2ogr
         * attempts to create the database which it doesn't have the privileges to do */
        ogr2ogr.addArgument("PG:host=localhost dbname=magic schemas=${PGSCHEMA} user=${PGUSER} password=${PGPASS}", true);
        ogr2ogr.addArgument("${TOCONVERT}", true);
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
            executor.execute(ogr2ogr);
        } catch (IOException ex) {
            /* Report what ogr2ogr wrote to stderr (may use the stdout output too at some point) */
            throw new ExecuteException("Error converting file : " + new String(ogrStderr.toByteArray(), StandardCharsets.UTF_8), exitValue);
        }
    }
        
    /**
     * Unpublish an existing dataset by deleting it from PosGIS, unpublishing from Geoserver and deleting it from userlayers
     * @param String uuid
     * @param String tableSchema
     * @param String tableName 
     */
    protected void removeExistingData(String uuid, String tableSchema, String tableName) throws DataAccessException {
        
        /* Drop the existing table, including any sequence and index previously created by ogr2ogr */
        getMagicDataTpl().execute("DROP TABLE IF EXISTS " + tableSchema + "." + tableName + " CASCADE");
     
        /* Drop any Geoserver feature corresponding to this table */
        getGrm().getPublisher().unpublishFeatureType(
            getEnv().getProperty("geoserver.local.userWorkspace"),
            getEnv().getProperty("geoserver.local.userPostgis"),
            tableName
        );
        
        /* Drop any record of this feature in the user features table */
        getMagicDataTpl().update("DELETE FROM " + getEnv().getProperty("postgres.local.userlayersTable") + " WHERE id=?", uuid);
    }
    
    /**
     * Insert/update record into the userlayers table
     * @param UploadedData ud 
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
                    getEnv().getProperty("geoserver.local.url") + "/" + getEnv().getProperty("geoserver.local.userWorkspace") + "/wms",
                    ud.getUfue().getUserDatastore(),
                    ud.getUfue().getUserPgLayer(),
                    ud.getUfue().getUserName(),
                    ud.getUfmd().getAllowed_usage(),
                    getJsonDataAsPgObject(ud.getUfmd().getStyledef())
                });
        } else {
            /* This is an update of an existing record */
            getMagicDataTpl().update("UPDATE " + getEnv().getProperty("postgres.local.userlayersTable") + " " + 
                "SET name=?,description=?,upload=?,filetype=?,store=?,layer=?,modified_date=current_timestamp,allowed_usage=?,styledef=? WHERE id=?", 
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
     * Construct the attribute map for Geoserver Manager for <schema>.<table>
     * @param UploadedFileMetadata md
     * @param String destTableName
     * @return GSFeatureTypeEncoder
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

        List<Map<String, Object>> recs = getMagicDataTpl().queryForList("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema=? AND table_name=?", tsch, tname);
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
     * @param String defaultStyle
     * @return GSLayerEncoder
     */
    protected GSLayerEncoder configureLayer(String defaultStyle) {
        GSLayerEncoder gsle = new GSLayerEncoder();
        gsle.setDefaultStyle(defaultStyle);
        gsle.setEnabled(true);
        gsle.setQueryable(true);
        return (gsle);
    }

    /**
     * Translate a PostgreSQL data type into a Java class binding (very simple,
     * may need to be extended if lots of other types come up)
     * @param String pgType
     * @return String
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
     * @param String name
     * @param boolean allowDot - allow a period to delimit the suffix in a filename
     * @param int lengthLimit - maximum string length, -1 to allow any
     * @return String
     */
    protected String standardiseName(String name, boolean allowDot, int lengthLimit) {
        String stdName = "";
        if (name != null && !name.isEmpty()) {
            stdName = name.toLowerCase().replaceAll(allowDot ? "[^a-z0-9.]" : "[^a-z0-9]", "_").replaceAll("_{2,}", "_").replaceFirst("_$", "");
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
     * @param long filesize
     * @return String
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

    public GeoServerRESTManager getGrm() {
        return grm;
    }

    public void setGrm(GeoServerRESTManager grm) {
        this.grm = grm;
    }
    
    public class GeoserverPublishException extends Exception {
        public GeoserverPublishException(String message) {
            super(message);
        }
    }

}
