/*
 * Publishing subclass for CSV data type
 */
package uk.ac.antarctica.mapengine.datapublishing;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.LinkedHashMap;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.model.UploadedData;
import uk.ac.antarctica.mapengine.util.CoordinateConversionUtils;
import uk.ac.antarctica.mapengine.util.GeoserverRestEndpointConnector;

@Component
public class CsvPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded CSV file
     * @param UploadedData md
     * @return String
     */
    @Override
    public void publish(UploadedData ud) throws GeoserverPublishException, IOException, DataAccessException {
        
        GeoserverRestEndpointConnector grec = new GeoserverRestEndpointConnector(null);
            
        String pgUserSchema = ud.getUfue().getUserPgSchema();
        String pgTable = standardiseName(ud.getUfmd().getName(), false, MAX_TABLENAME_LENGTH);
        String destTableName = pgUserSchema + "." + pgTable;
        
        /* Record the feature type name */
        ud.getUfue().setUserPgLayer(pgTable);

        /* Deduce table column types from CSV values and create the table */
        LinkedHashMap<String, String> columnTypes = getColumnTypeDictionary(ud.getUfmd().getUploaded());
        removeExistingData(grec, ud.getUfmd().getUuid(), ud.getUfue().getUserDatastore(), pgUserSchema, pgTable);
        StringBuilder ctSql = new StringBuilder("CREATE TABLE " + destTableName + " (\n");
        ctSql.append("pgid serial,\n");
        for (String key : columnTypes.keySet()) {
            ctSql.append("\"");
            ctSql.append(key);
            ctSql.append("\"");
            ctSql.append(" ");
            ctSql.append(columnTypes.get(key));
            ctSql.append(",\n");
        }
        ctSql.append("wkb_geometry geometry(Point, 4326)\n");
        ctSql.append(") WITH(OIDS=FALSE)");
        getMagicDataTpl().execute(ctSql.toString());
        getMagicDataTpl().execute("ALTER TABLE " + destTableName + " OWNER TO " + getEnv().getProperty("datasource.magic.username"));
        getMagicDataTpl().execute("ALTER TABLE " + destTableName + " ADD PRIMARY KEY (pgid)");
        populateTable(ud.getUfmd().getUploaded(), columnTypes, destTableName);
        
        /* Publish style to Geoserver */
        String styleName = createLayerStyling(grec, pgUserSchema, pgTable, ud.getUfmd().getStyledef(), null);
        /* Now publish to Geoserver */        
        if (!publishPgLayer(grec, ud.getUfue().getUserDatastore(), ud.getUfmd(), destTableName, styleName)) {
            throw new GeoserverPublishException("Publishing PostGIS table " + destTableName + " to Geoserver failed");
        }
        /* Insert/update the userlayers table record */
        updateUserlayersRecord(ud);
        /* Kill any stored cache */
        clearCache(grec, pgTable);
        
        grec.close();
    }
    
    /**
     * Populate the created PostgreSQL table using the values from the file
     * @param File csv
     * @param LinkedHashMap<String, String> columnTypes
     * @param String tableName
     * @throws FileNotFoundException
     * @throws IOException
     * @throws DataAccessException 
     */
    private void populateTable(File csv, LinkedHashMap<String, String> columnTypes, String tableName) throws FileNotFoundException, IOException, DataAccessException {
        
        /* Create INSERT statement */
        StringBuilder insertSql = new StringBuilder("INSERT INTO " + tableName + "(");
        String fieldList = "";
        String valuePlaceholders = "";
        int pos = 0;
        for (String key : columnTypes.keySet()) {            
            fieldList += ((pos == 0 ? "" : ",") + "\"" + key + "\"");
            valuePlaceholders += (pos == 0 ? "?" : ",?");
            pos++;
        }
        insertSql.append(fieldList);
        insertSql.append(") VALUES(");
        insertSql.append(valuePlaceholders);                
        insertSql.append(") RETURNING pgid");
        
        /* Read actual values */
        FileReader fileInput = new FileReader(csv);
        int count = 0;
        for (CSVRecord record : CSVFormat.DEFAULT.parse(fileInput)) {
            if (count > 0) {
                /* Skipped the header line, so this is an actual feature record */
                int i = 0;
                Object[] values = new Object[columnTypes.keySet().size()];                                             
                Double lat = null, lon = null;
                for (String key : columnTypes.keySet()) {
                    if (candidateLatitudeColumn(key)) {
                        /* Looks like a latitude => invoke conversion */
                        lat = CoordinateConversionUtils.toDecDegrees(record.get(i), true);
                    } else if (candidateLongitudeColumn(key)) {
                        /* Looks like a longitude => invoke conversion */
                        lon = CoordinateConversionUtils.toDecDegrees(record.get(i), false);
                    }
                    String value = record.get(i);
                    switch(columnTypes.get(key)) {
                        case "integer":
                            values[i] = (value == null || value.isEmpty()) ? null : Integer.parseInt(value);
                            break;
                        case "numeric":
                            values[i] = (value == null || value.isEmpty()) ? null : Double.parseDouble(value);
                            break;
                        default:
                            values[i] = (value == null || value.isEmpty()) ? null : value;  
                            break;
                    }                                      
                    i++;
                }                
                Integer added = getMagicDataTpl().queryForObject(insertSql.toString(), Integer.class, values);
                if (lat != null && lon != null) {
                    String setGeom = "UPDATE " + tableName + " SET wkb_geometry=st_geomfromtext('POINT(" + lon + " " + lat + ")', 4326) WHERE pgid=?";
                    getMagicDataTpl().update(setGeom, added);
                }
            }       
            count++;
        }
    }
    
    /**
     * Perform a scan of the file's contents, and make the best effort to deduce the PostgreSQL data types of the columns
     * NOTE: only recognises character varying|numeric|integer|text
     * @param File csv
     * @return LinkedHashMap
     * @throws FileNotFoundException
     * @throws IOException 
     */
    private LinkedHashMap<String, String> getColumnTypeDictionary(File csv) throws FileNotFoundException, IOException {
        FileReader fileInput = new FileReader(csv);
        boolean gotHeaders = false;
        LinkedHashMap<String, String> columnTypes = new LinkedHashMap();
        for (CSVRecord record : CSVFormat.DEFAULT.parse(fileInput)) {
            if (!gotHeaders) {
                /* These are the headers - create a list of names - bomb the process if any are empty or numeric */
                for (int i = 0; i < record.size(); i++) {
                    String colName = record.get(i);
                    if (colName.isEmpty() || StringUtils.isNumeric(colName)) {
                        throw new IOException("Bad column name >" + colName + "< in first row - check this contains the attribute names");
                    } else {
                        /* Initialise the Postgres type */
                        columnTypes.put(standardiseName(colName, false, -1), null);
                    }
                }
                gotHeaders = true;
            } else {
                /* Feature record */
                int i = 0;
                for (String key : columnTypes.keySet()) {
                    String attrValue = record.get(i);
                    String currAttrType = columnTypes.get(key);
                    String thisAttrType = getPostgresType(attrValue);
                    if (thisAttrType != null && (currAttrType == null || (getTypePriority(thisAttrType) > getTypePriority(currAttrType)))) {
                        columnTypes.put(key, thisAttrType);
                    }
                    i++;
                }                    
            }            
        }
        /* Postprocess to coerce all null types to character varying(254) */
        for (String key : columnTypes.keySet()) {
            if (columnTypes.get(key) == null) {
                columnTypes.put(key, "character varying(254)");
            }
        }    
        return(columnTypes);
    }
    
    /**
     * Get a plausible Postgres type for this value
     * NOTE: limited to integer, numeric or character varying()
     * @param String s
     * @return String
     */
    private String getPostgresType(String s) {
        String type = null;
        if (s != null && !s.isEmpty()) {
            try {
                Integer.parseInt(s);
                type = "integer";
            } catch(NumberFormatException | NullPointerException ex) {            
                try {
                    Double.parseDouble(s);
                    type = "numeric";
                } catch(NumberFormatException | NullPointerException ex2) {   
                    if (s.length() > 254) {
                        type = "text";
                    } else {
                        type = "character varying (254)";
                    }
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
        if (dataType != null) {
            if (dataType.equals("integer")) {
                priority = 1;
            } else if (dataType.equals("numeric")) {
                priority = 2;
            } else if (dataType.startsWith("character varying")) {
                priority = 3;
            } else if (dataType.equals("text")) {
                priority = 4;
            }
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
            "latdd",
            "latdms",
            "latddm",
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
            "longitude",
            "long",
            "londd",
            "londms",
            "londdm",
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
