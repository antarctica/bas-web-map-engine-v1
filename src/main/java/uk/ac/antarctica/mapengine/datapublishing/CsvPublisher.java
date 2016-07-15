/*
 * Publishing subclass for CSV data type
 */
package uk.ac.antarctica.mapengine.datapublishing;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.antarctica.mapengine.model.UploadedFileMetadata;

@Component
public class CsvPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded GPX or KML file
     * @param UploadedFileMetadata md
     * @return String
     */
    @Override
    @Transactional
    public String publish(UploadedFileMetadata md) {
        
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
        return (md.getName() + ": " + message);
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
