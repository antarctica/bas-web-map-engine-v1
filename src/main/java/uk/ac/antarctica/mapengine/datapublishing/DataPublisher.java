/*
 * Abstract base class for data publication to Geoserver workflows
 */
package uk.ac.antarctica.mapengine.datapublishing;

import it.geosolutions.geoserver.rest.GeoServerRESTPublisher;
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
import java.nio.charset.StandardCharsets;
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
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.ExecuteException;
import org.apache.commons.exec.ExecuteWatchdog;
import org.apache.commons.exec.PumpStreamHandler;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
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
    
    /* Geoserver Manager publisher */
    private GeoServerRESTPublisher grp = null;
    
    /* Map of PostgreSQL schema/credentials */
    private HashMap<String, String> pgMap = new HashMap();

    /* Access to OS level commands */
    private Runtime appRuntime = Runtime.getRuntime();

    public DataPublisher() {               
    }

    @Transactional
    public abstract String publish(UploadedData ud);
    
    /**
     * Create the working environment to process a data file upload
     * @param MultipartFile mpf
     * @param String userName
     * @return UploadedFileMetadata
     * @throws IOException 
     */
    public UploadedData initWorkingEnvironment(MultipartFile mpf, String userName) throws IOException, DataAccessException {
        
        if (getGrp() == null) {
            /* Create Geoserver publisher */
            setGrp(new GeoServerRESTPublisher(
                getEnv().getProperty("geoserver.local.url"), 
                getEnv().getProperty("geoserver.local.username"), 
                getEnv().getProperty("geoserver.local.password")
            ));
        }
        
        if (getPgMap().isEmpty()) {
            /* PostgreSQL credentials */
            getPgMap().put("PGUSER", getEnv().getProperty("datasource.magic.username"));
            getPgMap().put("PGPASS", getEnv().getProperty("datasource.magic.password").replaceAll("!", "\\\\!"));   /* ! is a shell metacharacter for UNIX */
        }

        UploadedData ud = new UploadedData();
        ud.setUfmd(new UploadedFileMetadata());
        ud.setUfue(new UploadedFileUserEnvironment());    
        
        /* Check user upload schema exists in Postgres and create it if it doesn't */
        ud.getUfue().setUserName(userName);
        ud.getUfue().setUserPgSchema(createPgSchema(userName));
        
        File wd = new File(WDBASE + Calendar.getInstance().getTimeInMillis());
        if (wd.mkdir()) {
            /* Created the tempotary working directory, move the uploaded file there for conversion */
            File uploaded = new File(wd.getAbsolutePath() + SEP + standardiseName(mpf.getOriginalFilename()));
            mpf.transferTo(uploaded);
            System.out.println("File transferred to : " + uploaded.getAbsolutePath());
            System.out.println("Is readable : " + (uploaded.canRead() ? "yes" : "no"));
            String basename = FilenameUtils.getBaseName(mpf.getOriginalFilename());
            ud.getUfmd().setUploaded(uploaded);
            ud.getUfmd().setName(basename);
            ud.getUfmd().setTitle(basename.replace("[^A-Za-z0-9]", " ").replace("\\s{2,}", " "));
            ud.getUfmd().setDescription(FilenameUtils.getExtension(mpf.getOriginalFilename()).toUpperCase() + 
                " file " + mpf.getOriginalFilename() + 
                " of size " + sizeFormatter(mpf.getSize()) + 
                " uploaded on " + new SimpleDateFormat("yyyy-MM-dd hh:mm:ss").format(new Date()) + 
                " by " + userName);
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
     * Create the named schema (a temporary UUID-named one if the input is null)
     * @param String fromName 
     * @return String the name of the created schema
     */
    protected String createPgSchema(String fromName) throws DataAccessException {
        if (fromName == null || fromName.isEmpty()) {
            fromName = "temp_" + UUID.randomUUID().toString();
        }
        /* Replace all non-lowercase alphanumerics with _ and truncate to 30 characters */
        String schemaName = fromName.toLowerCase().replaceAll("[^a-z0-9]", "_").replaceAll("_{2,}", "_").replaceFirst("_$", "").substring(0, 30);        
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
     * Unzip the given file into the same directory
     * @param File zip 
     */
    protected void unzipFile(File zip) throws FileNotFoundException, IOException {
        String workDir = zip.getParent();
        ZipInputStream zis = new ZipInputStream(new FileInputStream(zip));
        ZipEntry ze = zis.getNextEntry();
        while(ze != null) {
            File f = new File(workDir + SEP + ze.getName());
            FileOutputStream fos = new FileOutputStream(f);
            int len;
            byte buffer[] = new byte[1024];
            while ((len = zis.read(buffer)) > 0) {
                fos.write(buffer, 0, len);
            }
            fos.close();   
            ze = zis.getNextEntry();
        }
        zis.closeEntry();
        zis.close();
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
        ogr2ogr.addArgument("PG:host=localhost dbname=magic schemas=${PGSCHEMA} user=${PGUSER} password=${PGPASS}", false);
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
     * If table with given name exists in the upload schema, copy it to one with an archival name and remove the corresponding Geoserver feature
     * NOTE: tableName must include a schema prefix i.e. be of form <schema>.<tablename>
     * @param String tableSchema
     * @param String tableName 
     */
    protected void removeExistingData(String tableSchema, String tableName) throws DataAccessException {
        
        /* Drop the existing table, including any sequence and index previously created by ogr2ogr */
        getMagicDataTpl().execute("DROP TABLE " + tableSchema + "." + tableName + " CASCADE");
     
        /* Drop any Geoserver feature corresponding to this table */
        getGrp().unpublishFeatureType(
            getEnv().getProperty("geoserver.local.userWorkspace"),
            getEnv().getProperty("geoserver.local.userPostgis"),
            tableName
        );
        
        /* TODO - drop any record of this feature in the user features table */
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
     * Create a standardised file (and hence table) name from the user's
     * filename - done by lowercasing, converting all non-alphanumerics to _ and
     * sequences of _ to single _
     * @param String fileName
     * @return String
     */
    protected String standardiseName(String fileName) {
        String stdName = "";
        if (fileName != null && !fileName.isEmpty()) {
            stdName = fileName.toLowerCase().replaceAll("[^a-z0-9.]", "_").replaceAll("_{2,}", "_").replaceFirst("_$", "");
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

    public GeoServerRESTPublisher getGrp() {
        return grp;
    }

    public final void setGrp(GeoServerRESTPublisher grp) {
        this.grp = grp;
    }
    
    public final HashMap<String, String> getPgMap() {
        return pgMap;
    }
    
    public void setPgMap(HashMap<String, String> pgMap) {
        this.pgMap = pgMap;
    }

    public Runtime getAppRuntime() {
        return appRuntime;
    }

    public void setAppRuntime(Runtime appRuntime) {
        this.appRuntime = appRuntime;
    }

}
