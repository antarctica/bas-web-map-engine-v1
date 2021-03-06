/*
 * Proxy for readonly OGC service calls
 */

package uk.ac.antarctica.mapengine.controller;

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.apache.commons.io.IOUtils;
import org.apache.http.NameValuePair;
import org.apache.http.client.utils.URLEncodedUtils;
import org.geotools.ows.ServiceException;
import org.w3c.dom.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;
import uk.ac.antarctica.mapengine.config.SessionConfig;
import uk.ac.antarctica.mapengine.config.UserAuthorities;
import uk.ac.antarctica.mapengine.util.GenericUrlConnector;
import uk.ac.antarctica.mapengine.util.GenericUrlConnector.GenericUrlConnectorResponse;

@Controller
public class OgcServicesController {        
    
    @Autowired
    Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl; 
    
    @Autowired
    private SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;
        
    /**
     * Proxy for OGC readonly WMS and WFS services
     * @param HttpServletRequest request,
     * @param HttpServletResponse response,
     * @param Integer serviceid
     * @param String service (wms|wfs)
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/ogc/{serviceid}/{service}", method = RequestMethod.GET)
    public void ogcGateway(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("serviceid") Integer serviceid,
        @PathVariable("service") String service
    ) throws ServletException, IOException, ServiceException {                
        try {
            Map<String, Object> servicedata = magicDataTpl.queryForMap("SELECT * FROM " + env.getProperty("postgres.local.endpointsTable") + " WHERE id=?", serviceid);
            switch(service) {
                case "wms":
                    callWms(request, response, servicedata);
                    break;
                case "wfs":
                    callWfs(request, response, servicedata);
                    break;
                default:
                    throw new ServletException("Unrecognised service : " + service);
            }
        } catch(DataAccessException dae) {
            writeErrorResponse(response, 400, "application/json", "Error : message was " + dae.getMessage());
        } catch(RestrictedDataException rde) {
            writeErrorResponse(response, 401, "application/json", rde.getMessage());
        }        
    }
    
    /**
     * Proxy for OGC readonly WMS and WFS services for user data (applies extra security based on userlayers table)
     * @param HttpServletRequest request,
     * @param HttpServletResponse response,
     * @param String service (wms|wfs)
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/ogc/user/{service}", method = RequestMethod.GET)
    public void ogcUserGateway(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("service") String service
    ) throws ServletException, IOException, ServiceException {                
        try {
            switch(service) {
                case "wms":
                    callWms(request, response, null);
                    break;
                case "wfs":
                    callWfs(request, response, null);
                    break;
                default:
                    throw new ServletException("Unrecognised service : " + service);
            }
        } catch(DataAccessException dae) {
            writeErrorResponse(response, 400, "application/json", "Error : message was " + dae.getMessage());
        } catch(RestrictedDataException rde) {
            writeErrorResponse(response, 401, "application/json", rde.getMessage());
        }  
    }
    
    /**
     * WMS proxy
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param Map<String, Object> servicedata
     */
    private void callWms(HttpServletRequest request, HttpServletResponse response, Map<String, Object> servicedata) 
        throws RestrictedDataException, ServletException, IOException {
        
        String mimeType;                
        List<NameValuePair> params = decomposeQueryString(request);
        
        String operation = getQueryParameter(params, "request");
        if (operation == null) {
            throw new ServletException("Query string >" + request.getQueryString() + "< contains no 'request' parameter");
        }                
        
        String serviceUrl = (servicedata == null) ? 
            env.getProperty("geoserver.internal.url") + "/" + env.getProperty("geoserver.internal.userWorkspace") + "/wms" : (String)servicedata.get("url");        
        try {
            switch(operation.toLowerCase()) {
                case "getcapabilities": 
                    /* GetCapabilities document in text/xml */
                    String version = getQueryParameter(params, "version");
                    mimeType = "text/xml";
                    if (servicedata == null) {
                        getUserlayersCapsFromUrl(response, serviceUrl + "?service=wms&request=getcapabilities" + (version != null ? "&version=" + version : ""), mimeType);
                    } else {
                        getFromUrl(response, serviceUrl + "?service=wms&request=getcapabilities" + (version != null ? "&version=" + version : ""), mimeType, false); 
                    }
                    break;
                case "getmap":
                case "getlegendgraphic":
                    /* GetMap or GetLegendGraphic - apply additional security check based on userlayers table */
                    if (servicedata == null && !userLayerSecurityCheck(request, getQueryParameter(params, "layers"))) {
                        throw new RestrictedDataException("You are not authorised for access to layer " + getQueryParameter(params, "layers"));
                    }
                    mimeType = getQueryParameter(params, "format");
                    if (mimeType == null) {
                        mimeType = "image/png";
                    }
                    getFromUrl(response, serviceUrl + "?" + request.getQueryString(), mimeType, !operation.toLowerCase().equals("getlegendgraphic"));
                    break;
                case "getfeatureinfo":
                    /* GetFeatureInfo - apply additional security check based on userlayers table */
                    if (servicedata == null && !userLayerSecurityCheck(request, getQueryParameter(params, "layers"))) {
                        throw new RestrictedDataException("You are not authorised for access to layer " + getQueryParameter(params, "layers"));
                    }
                    mimeType = getQueryParameter(params, "info_format");
                    if (mimeType == null) {
                        mimeType = "application/json";
                    }
                    getFromUrl(response, serviceUrl + "?" + request.getQueryString(), mimeType, true);
                    break;
                default:
                    throw new ServletException("Unsupported WMS operation : " + operation);
            }
        } catch(RestrictedDataException rde) {
            if (operation.toLowerCase().equals("getmap")) {
                /* Output 256x256 transparent PNG image informing user of restricted access */
                mimeType = "image/png";
                String[] annotations;
                float bgTransp = 0.5f, textTransp = 1.0f;                
                if (rde.getMessage().startsWith("Error:")) {
                    /* Decided 2018-10-04 to simply output a completely transparent tile rather than report this error - there were a lot of them 
                     * occurring, possibly as a result of load balancer errors, server glitches etc */
                    bgTransp = textTransp = 0.0f;
                    annotations = new String[] {};
//                        "Error status " + rde.getMessage().substring(rde.getMessage().indexOf(":")+1),
//                        "fetching " + getQueryParameter(params, "layers"),
//                        "is server down?"
//                    };
                    System.out.println(
                            "Error status " + rde.getMessage().substring(rde.getMessage().indexOf(":")+1) + " " + 
                            "fetching " + getQueryParameter(params, "layers") + ". " + 
                            "Is server down?"
                    );
                } else {
                    annotations = new String[] {
                        "Layer " + getQueryParameter(params, "layers"),
                        "contains restricted data",
                        "log in to view"
                    };
                }
                BufferedImage bi = new BufferedImage(256, 256, BufferedImage.TRANSLUCENT);
                Graphics g = bi.getGraphics();
                g.setColor(new Color(1f, 1f, 1f, bgTransp));
                g.fillRect(0, 0, 256, 256);
                g.setFont(new Font("Arial", Font.PLAIN, 14));
                g.setColor(new Color(1f, 0f, 0f, textTransp));
                FontMetrics fm = g.getFontMetrics();
                int y = 100;
                for (String a : annotations) {
                    g.drawString(a, (256-fm.stringWidth(a))/2, y);
                    y += 20;
                }                                
                response.setContentType(mimeType);
                ImageIO.write(bi, "png", response.getOutputStream());  
                g.dispose();
            } else {
                writeErrorResponse(response, 401, "application/json", rde.getMessage());                 
            }                        
        }        
    }
    
    /**
     * WFS proxy
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param Map<String, Object> servicedata
     */
    private void callWfs(HttpServletRequest request, HttpServletResponse response, Map<String, Object> servicedata) 
        throws RestrictedDataException, ServletException, IOException { 
               
        boolean hasWfs = (servicedata == null) ? true : (Boolean)servicedata.get("has_wfs");
        String serviceUrl = (servicedata == null) ? 
            env.getProperty("geoserver.internal.url") + "/" + env.getProperty("geoserver.internal.userWorkspace") + "/wfs" : (String)servicedata.get("url");                
        
        if (hasWfs) {
            /* Service offers WFS - assume that the URL is a simple swap of 'wfs' for 'wms' at the end */            
            List<NameValuePair> params = decomposeQueryString(request);        
            String operation = getQueryParameter(params, "request");
            if (operation == null) {
                throw new ServletException("Query string >" + request.getQueryString() + "< contains no 'request' parameter");
            }
            if (servicedata == null && !userLayerSecurityCheck(request, getQueryParameter(params, "typenames"))) {
                throw new RestrictedDataException("You are not authorised for access to layer " + getQueryParameter(params, "typenames"));
            }
            if (serviceUrl.endsWith("/")) {
                serviceUrl = serviceUrl.substring(0, serviceUrl.length()-1);
            }
            String wfsUrl = serviceUrl.replaceFirst("wms$", "wfs");
            if (!wfsUrl.endsWith("wfs")) {
                wfsUrl = serviceUrl + "/wfs";
            }
            try {
                String mimeType;
                switch(operation.toLowerCase()) {
                    case "getfeature":
                        mimeType = getQueryParameter(params, "outputformat");
                        if (mimeType == null) {
                            mimeType = "application/json";
                        }
                        getFromUrl(response, wfsUrl + "?" + request.getQueryString(), mimeType, true);
                        break;
                    case "describefeaturetype":
                        mimeType = "text/xml";                   
                        getFromUrl(response, wfsUrl + "?" + request.getQueryString(), mimeType, true);
                        break;                        
                    default:
                        throw new ServletException("Unsupported WFS operation : " + operation);
                }
            } catch(RestrictedDataException rde) {
                writeErrorResponse(response, 401, "application/json", rde.getMessage());               
            }
        } else {
            throw new RestrictedDataException("Service does not allow WFS"); 
        }       
    }
    
    /**
     * Check current user can access this layer, according to the userlayers table
     * @param HttpServletRequest request
     * @param String layer
     * @return boolean
     */
    private boolean userLayerSecurityCheck(HttpServletRequest request, String layer) {
        
        if (layer == null) {
            return(false);
        } else if (!layer.startsWith("user:")) {
            /* This is not a user layer, so we defer to Geoserver to decide */
            return(true);            
        } else {
            /* Strip workspace */
            layer = layer.substring(5);
        }
        HashMap<String,Boolean> accessibleLayers = determineAccessibleLayers();
        return(accessibleLayers.containsKey(layer));        
    }
    
    /**
     * Write error response to the output
     * @param HttpServletResponse response
     * @param int status
     * @param String mimeType
     * @param String message 
     */
    private void writeErrorResponse(HttpServletResponse response, int status, String mimeType, String message) {
        String jsonOut = "{\"status\":" + status + ",\"message\":\"" + message + "\"}";
        response.setStatus(status);
        response.setContentType(mimeType);
        try {
            IOUtils.copy(new ByteArrayInputStream(jsonOut.getBytes(StandardCharsets.UTF_8)), response.getOutputStream());
        } catch (IOException ioe) {
        }
    }
    
    /**
     * Break down the supplied query string into name/value pairs
     * @param HttpServletRequest request
     * @return List<NameValuePair>
     */
    private List<NameValuePair> decomposeQueryString(HttpServletRequest request) {
        String qry = request.getQueryString();
        if (qry != null) {
            return(URLEncodedUtils.parse(request.getQueryString(), Charset.defaultCharset()));
        } else {
            return(new ArrayList());
        }
    }
    
    /**
     * Post-apply user layer security checks to the GetCaps document
     * @param HttpServletResponse response
     * @param String url
     * @param String mimeType 
     */
    private void getUserlayersCapsFromUrl(HttpServletResponse response, String url, String mimeType) {
        
        /* Note: Extents for dynamic layers like BLIP etc may be out if fetched from GetCapabilities see:
         * https://gis.stackexchange.com/questions/124527/how-to-make-geoserver-dynamically-calculate-the-bounding-box-of-a-postgis-backed */
               
        GenericUrlConnector guc = null;
        try {
            /* Find the layers this user can access */
            HashMap<String,Boolean> userlayerDict = determineAccessibleLayers();
            
            /* Now get the Capabilities document and parse for the layers, removing those that don't have dictionary entries */
            guc = new GenericUrlConnector(url.startsWith("https"));
            GenericUrlConnectorResponse gucOut = guc.get(url);            
            if (gucOut.getStatus() < 400) {
                String caps = IOUtils.toString(gucOut.getContent());
                DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                dbf.setValidating(false);
                DocumentBuilder db = dbf.newDocumentBuilder();
                Document doc = db.parse(new ByteArrayInputStream(caps.getBytes(StandardCharsets.UTF_8)));
                NodeList layers = doc.getElementsByTagName("Layer");
                ArrayList<Node> layerList = new ArrayList();
                for (int i = 0; i < layers.getLength(); i++) {
                    layerList.add(layers.item(i));
                }
                int nKept = 0, nRemoved = 0;
                for (int i = 0; i < layerList.size(); i++) {
                    Node layer = layerList.get(i);
                    NodeList layerChildren = layer.getChildNodes();
                    Node layerName = null;
                    for (int j = 0; j < layerChildren.getLength(); j++) {
                        if (layerChildren.item(j).getNodeName().equals("Name")) {
                            layerName = layerChildren.item(j);
                            break;
                        }
                    }
                    if (layerName != null) {
                        String nameText = layerName.getTextContent();
                        nameText = nameText.substring(nameText.indexOf(":")+1);
                        if (!userlayerDict.containsKey(nameText)) {
                            layer.getParentNode().removeChild(layer);
                            nRemoved++;
                        } else {
                            nKept++;
                        }
                    }
                }
                doc.normalizeDocument();
                /* https://stackoverflow.com/questions/865039/how-to-create-an-inputstream-from-a-document-or-node */
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                Source xmlSource = new DOMSource(doc);
                Result outputTarget = new StreamResult(outputStream);
                TransformerFactory.newInstance().newTransformer().transform(xmlSource, outputTarget);
                InputStream is = new ByteArrayInputStream(outputStream.toByteArray());                
                response.setContentType(mimeType);
                IOUtils.copy(is, response.getOutputStream());
            } else {
                writeErrorResponse(response, 400, "application/json", "Failed to retrieve GetCapabilities document from " + url);
            }
        } catch (SAXException sax) {
            writeErrorResponse(response, 500, "application/json", "Error parsing GetCapabilities document from " + url + ": " + sax.getMessage());
        } catch (IOException | ParserConfigurationException | TransformerConfigurationException ioe) {
            writeErrorResponse(response, 500, "application/json", "Error parsing GetCapabilities document from " + url + ": " + ioe.getMessage());
        } catch (TransformerException tre) {
            writeErrorResponse(response, 500, "application/json", "Error parsing GetCapabilities document from " + url + ": " + tre.getMessage());
        } catch (NoSuchAlgorithmException | KeyStoreException | KeyManagementException ex) {
            System.out.println("SSL error getting content from " + url + ", exception was: " + ex.getMessage());
        } finally {
            if (guc != null) {
                guc.close();
            }
        }  
    }
    
    /**
     * Compute the set of layers this user has access to 
     * @return HashMap<String,Boolean>
     */
    private HashMap<String,Boolean> determineAccessibleLayers() {
        
        HashMap<String,Boolean> userlayerDict = new HashMap();
                
        /* Query the currently stored security context */
        ArrayList args = new ArrayList();        
        List<Map<String,Object>> listLayers = magicDataTpl.queryForList(
            "SELECT layer FROM " + env.getProperty("postgres.local.userlayersTable") + " WHERE " + 
            userAuthoritiesProvider.getInstance().sqlRoleClause("allowed_usage", "owner", args, "read"), 
            args.toArray()
        );
        /* Now have the "definites" list - create an easy-to-read dictionary */        
        if (listLayers != null) {
            listLayers.forEach((lnm) -> {
                userlayerDict.put((String)lnm.get("layer"), Boolean.TRUE);
            });
        }        
        return(userlayerDict);
    }
    
    /**
     * Retrieve optionally restricted content from the given URL by means of an http(s) GET
     * @param HttpServletResponse response
     * @param String url
     * @param String mimeType
     * @param boolean secured
     * @throws IOException, RestrictedDataException
     */
    private void getFromUrl(HttpServletResponse response, String url, String mimeType, boolean secured) throws IOException, RestrictedDataException { 
               
        GenericUrlConnector guc = null;
        
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        
        /* Determine if URL comes from local Geoserver */
        String username = null, password = null;
        String localServer = env.getProperty("geoserver.internal.url");
        boolean isLocal = url.startsWith(localServer);
               
        if (!isLocal) {
            String[] externalAliases = env.getProperty("geoserver.external.url").split(",");
            for (String alias : externalAliases) {              
                if (url.startsWith(alias)) {
                    isLocal = true;
                    break;
                }
            }
        }       
        
        if (isLocal) {
            /* Get username and password */
            username = ua.currentUserName();
            password = ua.currentUserPassword();            
        }        
        
        try {
            guc = new GenericUrlConnector(url.startsWith("https"));                     
            GenericUrlConnectorResponse gucOut = guc.get(url, username, password, null);
            if (gucOut.getStatus() < 400) {
                /* Pipe the output to servlet response stream */
                response.setContentType(mimeType);
                IOUtils.copy(gucOut.getContent(), response.getOutputStream());                
            } else if (gucOut.getStatus() == 401) {
                /* User unauthorised */                     
                throw new RestrictedDataException("You are not authorised to access this resource");
            } else {                                   
                if (gucOut.getStatus() == 403) {
                    System.out.println("=== OgcServicesController.getFromUrl() at " + new Date().toString() + " - Http 403 returned for URL : " + url);
                    System.out.println("=== Content output was : " + IOUtils.toString(gucOut.getContent()));
                    System.out.println("=== End");
                }
                throw new RestrictedDataException("Error:" + gucOut.getStatus());
            }
        } catch(IOException ioe) {
            System.out.println("Failed to get content from " + url + ", exception was: " + ioe.getMessage());
        } catch (NoSuchAlgorithmException | KeyStoreException | KeyManagementException ex) {
            System.out.println("SSL error getting content from " + url + ", exception was: " + ex.getMessage());
        } finally {
            if (guc != null) {
                guc.close();
            }
        }        
    }

    /**
     * Retrieve a query parameter by name, case-insensitive
     * @param List<NameValuePair> params
     * @param String targetKey
     * @return String
     */
    private String getQueryParameter(List<NameValuePair> params, String targetKey) {
        for (NameValuePair param : params) {
            if (param.getName().toLowerCase().equals(targetKey)) {
                return(param.getValue());
            }
        }
        return(null);
    }
    
    public class RestrictedDataException extends Exception {
        public RestrictedDataException(String message) {
            super(message);
        }
    }

}
