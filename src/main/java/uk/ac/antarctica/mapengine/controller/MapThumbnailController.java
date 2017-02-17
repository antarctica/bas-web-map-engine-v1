/*
 * API for calling external thumbnailing services 
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.io.IOUtils;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.ServletContextAware;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class MapThumbnailController implements ServletContextAware {
    
    /* Thumbnail location */
    private static final String THUMBNAIL_CACHE = "/static/images/thumbnail_cache";
    
    /* Thumbnailing service */
    private static final String SHRINKTHEWEB = "https://images.shrinktheweb.com/xino.php?stwembed=0&stwaccesskeyid=2aa21387d887a28&stwu=e3492&stwsize=200x150&stwadv=json&stwurl=";
    
    @Autowired
    Environment env;
   
    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    /* Servlet context */
    private ServletContext context;

    @InitBinder
    protected void initBinder(WebDataBinder binder) {        
    }
    
    /**
     * Negotiate getting the thumbnail for a given map from STW services
     * @param HttpServletRequest request,
     * @param String mapname
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/thumbnail/{mapname}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> thumbnailData(HttpServletRequest request, @PathVariable("mapname") String mapname)
        throws ServletException, IOException, ServiceException {
        
        ResponseEntity<String> ret = null;
        JsonObject resultPayload = new JsonObject();
        
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        int port = request.getServerPort();
        String server = request.getScheme() + "://" + request.getServerName() + (port != 80 ? (":" + port) : "");

        /* Get the thumbnail for public sites - restricted ones can have a thumbnail uploaded or use a placeholder */                
        String thumbUrl = THUMBNAIL_CACHE + "/bas.jpg";                 
        if (!request.getServerName().equals("localhost") || mapname.equals("add7")) {   // TEST - please delete the mapname.equals("add7") bit
            /* Use STW for non-local server */            
            thumbUrl = THUMBNAIL_CACHE + "/" + getActiveProfile() + "/" + mapname + ".jpg";
            String genThumbPath = context.getRealPath(thumbUrl);
            System.out.println("-------------------------------");
            System.out.println("Server : " + server);
            System.out.println("Thumbnail destination : " + thumbUrl);
            System.out.println("Filesystem path : " + genThumbPath);
            System.out.println("-------------------------------");
            File thumbnail = new File(genThumbPath);
            if (!thumbnail.exists()) {
                /* Retrieve an image from shrinktheweb.com and write it to the thumbnail cache */
                /* Note: 2017-02-01 David - Need to use the STW advanced API which is a two-step process
                https://support.shrinktheweb.com/Knowledgebase/Article/View/128/0/best-practice-method-to-get-screenshot-requests-as-soon-as-ready
                https://shrinktheweb.com/uploads/STW_API_Documentation.pdf */
                System.out.println("Using STW thumbnail generation service");
                try {
                    String mapUrl = server + "/home/" + mapname;
                    if (mapname.equals("add7")) {
                        // TEST - please delete the mapname.equals("add7") bit
                        mapUrl = "http://www.add.scar.org/home/add7";
                    }
                    URL stwUrl = new URL(SHRINKTHEWEB + mapUrl);
                    /* Override SSL checking
                     * See http://stackoverflow.com/questions/13626965/how-to-ignore-pkix-path-building-failed-sun-security-provider-certpath-suncertp */
                    TrustManager[] trustAllCerts = new TrustManager[] {new X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() {return null;}
                        public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                        public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                    }};

                    SSLContext sc = SSLContext.getInstance("SSL");
                    sc.init(null, trustAllCerts, new java.security.SecureRandom());
                    HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

                    /* Create all-trusting host name verifier */
                    HostnameVerifier allHostsValid = new HostnameVerifier() {
                        public boolean verify(String hostname, SSLSession session) {return true;}
                    };
                    /* Install the all-trusting host verifier */
                    HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);
                    HttpsURLConnection con = (HttpsURLConnection)stwUrl.openConnection();
                    con.setConnectTimeout(5000);
                    con.setReadTimeout(10000);
                    String content = IOUtils.toString(con.getInputStream());
                    System.out.println("-------------------------------");
                    System.out.println("STW call : " + stwUrl.toString());
                    System.out.println("Returned content : " + content);
                    System.out.println("-------------------------------");
                    /* Parse STW API JSON output */
                    JsonParser jp = new JsonParser();
                    JsonObject stwOut = jp.parse(content).getAsJsonObject();
                    boolean exists = stwOut.getAsJsonPrimitive("exists").getAsBoolean();
                    String actionMsg = stwOut.getAsJsonPrimitive("actionmsg").getAsString();
                    String responseStatus = stwOut.getAsJsonPrimitive("responsestatus").getAsString();
                    if (responseStatus.equalsIgnoreCase("success")) {
                        System.out.println("Successful call to STW");
                        if (exists && actionMsg.equalsIgnoreCase("delivered")) {
                            System.out.println("Exists and delivered");
                            setJsonPayload(resultPayload, thumbUrl, true, false); 
                            /* Now get the actual thumbnail image */
                            URL imageUrl = new URL(stwOut.getAsJsonPrimitive("image").getAsString().replaceAll("\\\\", ""));
                            InputStream is = imageUrl.openStream();
                            OutputStream fos = new FileOutputStream(thumbnail);
                            byte[] buffer = new byte[4096];
                            int n = -1;
                            while ((n = is.read(buffer)) != -1) {
                                fos.write(buffer, 0, n);
                            }
                            is.close();
                            fos.close();  
                            System.out.println("Completed thumbnail image write");
                        } else if (!actionMsg.equalsIgnoreCase("noretry")) {
                            System.out.println("STW reported image still on the way - have another try in a while");
                            setJsonPayload(resultPayload, thumbUrl, false, true);
                        } else {
                            System.out.println("STW indicated not worth retrying");
                            setJsonPayload(resultPayload, THUMBNAIL_CACHE + "/bas.jpg", false, false);
                        }
                    } else {
                        /* Give up - something wrong at the STW end */
                        System.out.println("Problems at the STW end - giving up");
                        setJsonPayload(resultPayload, THUMBNAIL_CACHE + "/bas.jpg", false, false);  
                    }                                                                              
                } catch(IOException | KeyManagementException | NoSuchAlgorithmException ex) {
                    System.out.println("Exception : " + ex.getMessage());
                    setJsonPayload(resultPayload, THUMBNAIL_CACHE + "/bas.jpg", false, false);                    
                }
            }              
        } else {
            /* Return the defaults for localhost */
            setJsonPayload(resultPayload, thumbUrl, true, false);
        }
        ret = PackagingUtils.packageResults(HttpStatus.OK, resultPayload.toString(), null);        
        return(ret);
    }
    
    /**
     * Negotiate getting the thumbnail for a given map from STW services
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/clearthumbnailcache", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> thumbnailData(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {        
        ResponseEntity<String> ret = null;            
        try {
            File tnDir = new File(context.getRealPath(THUMBNAIL_CACHE + "/" + getActiveProfile()));
            if (tnDir.exists() && tnDir.isDirectory()) {
                FileUtils.cleanDirectory(tnDir);
            }
            ret = PackagingUtils.packageResults(HttpStatus.OK, "{\"status\":\"ok\"}", null);
        } catch (IOException ex) {
            ret = PackagingUtils.packageResults(HttpStatus.OK, "{\"status\":\"" + ex.getMessage() + "\"}", null);
        }
        return(ret);
    }
    
    /**
     * Package up the return JSON payload
     * @param JsonObject payload
     * @param String thumburl
     * @param boolean delivered
     * @param boolean retry 
     */
    private void setJsonPayload(JsonObject payload, String thumburl, boolean delivered, boolean retry) {        
        payload.addProperty("thumburl", thumburl);
        payload.addProperty("delivered", delivered);
        payload.addProperty("retry", retry);
    }
    
    /**
     * Get the current active profile
     * @return 
     */
    private String getActiveProfile() {
        String[] profiles = env.getActiveProfiles();
        String activeProfile = "add";
        if (profiles != null && profiles.length > 0) {
            activeProfile = profiles[0];
        }
        return(activeProfile);
    }

    @Override
    public void setServletContext(ServletContext sc) {
        this.context = sc;
    }

}
