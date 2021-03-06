/*
 * Management of user uploaded data
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.ServletContextAware;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import uk.ac.antarctica.mapengine.config.SessionConfig;
import uk.ac.antarctica.mapengine.datapublishing.CsvPublisher;
import uk.ac.antarctica.mapengine.datapublishing.DataPublisher;
import uk.ac.antarctica.mapengine.datapublishing.DataPublisher.GeoserverPublishException;
import uk.ac.antarctica.mapengine.datapublishing.GpxPublisher;
import uk.ac.antarctica.mapengine.datapublishing.KmlPublisher;
import uk.ac.antarctica.mapengine.datapublishing.NoUploadPublisher;
import uk.ac.antarctica.mapengine.datapublishing.ShpZipPublisher;
import uk.ac.antarctica.mapengine.model.UploadedData;
import uk.ac.antarctica.mapengine.util.GeoserverRestEndpointConnector;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class UserLayerController implements ApplicationContextAware, ServletContextAware {
    
    @Autowired
    private Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    @Autowired
    private JsonParser jsonParser;
    
    @Autowired
    private Gson jsonMapper;
    
    @Autowired
    protected SessionConfig.GeoserverRestEndpointConnectorProvider geoserverRestEndpointConnectorProvider;
    
    @Autowired
    protected SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;
    
    private ApplicationContext applicationContext;
    
    private ServletContext servletContext;
            
    /**
     * Get all user layers the logged in user can view
     * @param HttpServletRequest request,    
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/userlayers/data", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> getUserLayerData(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        
        ResponseEntity<String> ret;
        
        String tableName = env.getProperty("postgres.local.userlayersTable");
        try {
            ArrayList args = new ArrayList();
            List<Map<String, Object>> userLayerData = magicDataTpl.queryForList(
                "SELECT id,caption,description,service,layer,modified_date,owner,allowed_usage,styledef::text FROM " + tableName + " WHERE " + 
                userAuthoritiesProvider.getInstance().sqlRoleClause("allowed_usage", "owner", args, "read") + " ORDER BY caption",
                args.toArray()
            );
            if (userLayerData != null && !userLayerData.isEmpty()) {
                JsonArray views = jsonMapper.toJsonTree(userLayerData).getAsJsonArray();
                ret = PackagingUtils.packageResults(HttpStatus.OK, views.toString(), null);
            } else {
                /* No data is fine - simply return empty results array */
                ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
            }
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Exception fetching user layer data - error was : " + dae.getMessage());
        }
        return(ret);
    }
    
    /**
     * Update a user layer whose data is POST-ed (with no uploaded file)
     * @param String id
     * @param String op
     * @throws Exception
     */
    @RequestMapping(value = "/userlayers/{id}/{op}", method = RequestMethod.GET, 
            produces = {"application/gpx+xml", "application/vnd.google-earth.kml+xml", "application/zip", "application/json; charset=utf-8"})
    @ResponseBody
    public void getUserlayerField(HttpServletRequest request, HttpServletResponse response,
        @PathVariable("id") String id,
        @PathVariable("op") String op) throws Exception {
        
        String mimeType = "application/json; charset=utf-8";
        ArrayList args = new ArrayList();
        
        switch(op) {
            case "extent":                
                args.add(id);
                Map<String, Object> rec = magicDataTpl.queryForMap(
                    "SELECT store, layer FROM " + env.getProperty("postgres.local.userlayersTable") + " WHERE id=? AND " +
                    userAuthoritiesProvider.getInstance().sqlRoleClause("allowed_usage", "owner", args, "read"),
                    args.toArray()
                );
                String layer = (String)rec.get("layer");
                String store = (String)rec.get("store");
                if (layer != null && !layer.isEmpty()) {
                    GeoserverRestEndpointConnector grec = geoserverRestEndpointConnectorProvider.getInstance();
                    JsonElement je = grec.getJson(
                        "workspaces/" + env.getProperty("geoserver.internal.userWorkspace") + "/datastores/" + store + "/featuretypes/" + layer,
                        "featureType/latLonBoundingBox"
                    );
                    if (je != null) {
                        try {
                            JsonObject bbox = je.getAsJsonObject();
                            JsonArray ja = new JsonArray();
                            ja.add(new JsonPrimitive(bbox.getAsJsonPrimitive("minx").getAsDouble()));
                            ja.add(new JsonPrimitive(bbox.getAsJsonPrimitive("miny").getAsDouble()));
                            ja.add(new JsonPrimitive(bbox.getAsJsonPrimitive("maxx").getAsDouble()));
                            ja.add(new JsonPrimitive(bbox.getAsJsonPrimitive("maxy").getAsDouble()));                                    
                            writeOut(response, 200, "application/json; charset=utf-8", ja.toString(), null);
                        } catch(IOException ex) {
                            writeOut(response, 400, "application/json; charset=utf-8", "Malformed JSON response for Layer " + layer, null);
                        }       
                    } else {
                        writeOut(response, 400, "application/json; charset=utf-8", "Failed to get bounding box for layer " + layer, null);
                    }
                    grec.close();
                } else {
                    writeOut(response, 400, "application/json; charset=utf-8", "Failed to find readable layer record with id " + id, null);                    
                }
                break;
            case "data":
                args.add(id);
                List<Map<String, Object>> ulDataList = magicDataTpl.queryForList(
                    "SELECT filetype, upload, layer FROM " + env.getProperty("postgres.local.userlayersTable") + " WHERE id=? AND " + 
                    userAuthoritiesProvider.getInstance().sqlRoleClause("allowed_usage", "owner", args, "read"),
                    args.toArray()
                );
                if (!ulDataList.isEmpty() && ulDataList.size() == 1) {
                    Map<String, Object> ulData = ulDataList.get(0);
                    byte[] data = (byte[])ulData.get("upload");
                    String type = (String)ulData.get("filetype");
                    String filename = (String)ulData.get("layer") + "." + type;
                    switch(type) {
                        case "gpx": mimeType = "application/gpx+xml"; break;
                        case "kml": mimeType = "application/vnd.google-earth.kml+xml"; break;
                        case "csv": mimeType = "text/csv"; break;
                        case "zip": mimeType = "application/zip"; break;
                        default: break;
                    }
                    writeOut(response, 200, mimeType, data, filename);
                } else {
                    writeOut(response, 400, "application/json; charset=utf-8", "Failed to find readable layer record with id " + id, null);
                }
                break;
            default:
                writeOut(response, 400, "application/json; charset=utf-8", "Unrecognised operation " + op, null);
                break;
        }        
    }
    
    /**
     * Save an uploaded layer record
     * @param HttpServletRequest request
     * @return
     * @throws Exception 
     */    
    @RequestMapping(value = "/userlayers/save", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> saveUserLayerData(MultipartHttpServletRequest request) throws Exception {
                
        int count = 0;
        ResponseEntity<String> ret = null;
        String userName = userAuthoritiesProvider.getInstance().currentUserName();
        String uuid = request.getParameter("id");
        
        if (isOwner(uuid, userName)) {
        
            System.out.println("*** Received POST parameters ***");
            Enumeration parmNames = request.getParameterNames();
            while (parmNames.hasMoreElements()) {
                String key = (String)parmNames.nextElement();
                System.out.println(key + " : >" + request.getParameter(key) + "<");
            }
            System.out.println("*** End of POST parameters ***");
            Map<String, MultipartFile> fmp = request.getFileMap();
            if (fmp == null || fmp.isEmpty()) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No file was uploaded");
            } else {
                /* Process file upload alongside attribute data */
                for (MultipartFile mpf : request.getFileMap().values()) {

                    System.out.println("*** File no " + (count+1));
                    System.out.println("Publish workflow started at " + (new Date().toString()));
                    System.out.println("Original name : " + mpf.getOriginalFilename());
                    System.out.println("Name : " + mpf.getName());
                    System.out.println("Content type : " + mpf.getContentType());
                    System.out.println("Size : " + mpf.getSize());
                    System.out.println("*** End of file no " + (count+1));

                    try {
                        String extension = FilenameUtils.getExtension(mpf.getOriginalFilename());
                        DataPublisher pub = getPublisher(extension);
                        if (pub != null) {
                            /* Publish the file */
                            UploadedData ud = pub.initWorkingEnvironment(servletContext, mpf, request.getParameterMap(), userName);
                            pub.publish(ud);                    
                            pub.cleanUp(ud.getUfmd().getUploaded());                    
                            ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Published ok");
                        } else {
                            /* Unsupported extension type */
                            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Unsupported extension type " + extension);
                        }
                    } catch(GeoserverPublishException gpe) {
                        ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Geoserver publish failed with error : " + gpe.getMessage());
                    } catch(IOException | DataAccessException ex) {
                        ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Publish failed with error : " + ex.getMessage());
                    } catch(BeansException be) {
                        ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Failed to create publisher bean : " + be.getMessage());
                    }                       
                    System.out.println("*** File no " + (count+1));
                    System.out.println("Publish workflow ended at " + (new Date().toString()) + " with output " + ret.toString());            
                    System.out.println("*** End of file no " + (count+1));            
                    count++;
                }
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "User " + userName + " is not the owner of record with id " + uuid);
        }
        return(ret);
    }
    
    /**
     * Update a user layer whose data is POST-ed (with no uploaded file)
     * @param String id
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/userlayers/update/{id}", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> updateMap(HttpServletRequest request,
        @PathVariable("id") String id,
        @RequestBody String payload) throws Exception {
        
        ResponseEntity<String> ret;        
        
        String userName = userAuthoritiesProvider.getInstance().currentUserName();     
        if (isOwner(id, userName)) {
            try {
                /* No file upload => save attribute data only */
                JsonElement je = jsonParser.parse(payload);
                JsonObject jo = je.getAsJsonObject();
                /* Read data payload into appropriate map form */
                HashMap<String,String[]> parms = new HashMap();
                parms.put("id", new String[]{jo.get("id").getAsString()});
                parms.put("caption", new String[]{jo.get("caption").getAsString()});
                parms.put("description", new String[]{jo.get("description").getAsString()});
                parms.put("allowed_usage", new String[]{jo.get("allowed_usage").getAsString()});
                parms.put("styledef", new String[]{jo.get("styledef").getAsString()});
                DataPublisher pub = getPublisher("none");
                UploadedData ud = pub.initWorkingEnvironment(servletContext, null, parms, userName);
                pub.publish(ud);                    
                ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Published ok");
            } catch(GeoserverPublishException gpe) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Geoserver publish failed with error : " + gpe.getMessage());
            } catch(IOException | DataAccessException ex) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Publish failed with error : " + ex.getMessage());
            } catch(BeansException be) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Failed to create publisher bean : " + be.getMessage());
            }          
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "You are not the owner of this user layer");
        }    
        return(ret);
    }
    
    /**
     * Delete a user layer by id
     * @param String id
     * @throws Exception
     */
    @RequestMapping(value = "/userlayers/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteUserLayer(HttpServletRequest request,
        @PathVariable("id") String id) throws Exception {
        
        ResponseEntity<String> ret;
        
        String userName = userAuthoritiesProvider.getInstance().currentUserName();
        if (isOwner(id, userName)) {
            /* Logged-in user is the owner of the layer => do deletion */            
            try {
                getPublisher("none").unpublish(id);                                       
                ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully deleted");
            } catch(GeoserverPublishException gpe) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + gpe.getMessage());
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "You are not the owner of this user layer");
        }       
        return (ret);
    }  
    
    /**
     * Return bean instance appropriate to file type
     * @param String fileType
     * @return 
     */    
    private DataPublisher getPublisher(String fileType) {
        DataPublisher pub = null;
        switch(fileType) {
            case "gpx":
                pub = applicationContext.getBean(GpxPublisher.class);
                break;
            case "kml":
                pub = applicationContext.getBean(KmlPublisher.class);
                break;
            case "csv":
                pub = applicationContext.getBean(CsvPublisher.class);
                break;
            case "zip":
                pub = applicationContext.getBean(ShpZipPublisher.class);
                break;
            case "none":
                pub = applicationContext.getBean(NoUploadPublisher.class);
                break;
            default:
                break;
        }
        return(pub);
    }
    
    /**
     * Write response to the output body
     * @param HttpServletResponse response
     * @param int status
     * @param String mimeType
     * @param Object output
     * @param String filename
     * @throws IOException 
     */
    private void writeOut(HttpServletResponse response, int status, String mimeType, Object output, String filename) throws IOException {
        ByteArrayInputStream bais;
        if (output instanceof String) {
            bais = new ByteArrayInputStream(((String) output).getBytes(StandardCharsets.UTF_8));
        } else if (output instanceof byte[]) {
            bais = new ByteArrayInputStream((byte[])output);
            if (filename == null) {
                filename = "data.txt";
            }
            response.addHeader("Content-Disposition", "inline; filename=\"" + filename + "\"");
        } else {
            output = "Unrecognised output type";
            bais = new ByteArrayInputStream(((String) output).getBytes(StandardCharsets.UTF_8));
            status = 400;
            mimeType = "application/json; charset=utf-8";
        }
        response.setContentType(mimeType);
        response.setStatus(status);
        IOUtils.copy(bais, response.getOutputStream());
    }    

    public ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    @Override
    public void setApplicationContext(ApplicationContext ac) throws BeansException {
        applicationContext = ac;
    }
    
    @Override
    public void setServletContext(ServletContext sc) {
        servletContext = sc;
    }
    
    /**
     * Is the current user the owner of the record with given id
     * @param String uuid
     * @param String userName
     * @return boolean 
     */
    private boolean isOwner(String uuid, String userName) {
        if (uuid == null || uuid.isEmpty()) {
            return(true);
        }
        return(magicDataTpl.queryForObject(
            "SELECT count(id) FROM " + env.getProperty("postgres.local.userlayersTable") + " WHERE id=? AND owner=?", 
            new Object[]{uuid, userName}, 
            Integer.class
        ) == 1);
    }

}