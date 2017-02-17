/*
 * API for calling external thumbnailing services 
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.security.cert.X509Certificate;
import java.util.List;
import java.util.Map;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
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
    private static final String SHRINKTHEWEB = "https://images.shrinktheweb.com/xino.php?stwembed=0&stwaccesskeyid=2aa21387d887a28&stwsize=200x150&stwadv=json&stwurl=";
    
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
     * Get all the data necessary for displaying gallery of all available map thumbnails
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/thumbnaildata", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> thumbnailData(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        ResponseEntity<String> ret = null;
        
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        int port = request.getServerPort();
        String server = request.getScheme() + "://" + request.getServerName() + (port != 80 ? (":" + port) : "");
        
        List<Map<String, Object>> mapData = null;//magicDataTpl.queryForList(
//            "SELECT name, title, description, modified_date, version, allowed_usage, allowed_edit, owner_name FROM " + 
//            env.getProperty("postgres.local.mapsTable") + " " + 
//            "ORDER BY title"
//        );        
        if (mapData != null && !mapData.isEmpty()) {
            /* Package map data as JSON array - note we want to list all maps regardless of whether login required */
            JsonArray ja = new JsonArray();
            for (Map m : mapData) {
                String mapName = (String)m.get("name");
                String allowedUsage = (String)m.get("allowed_usage");
                String allowedEdit = (String)m.get("allowed_edit");
                String owner = (String)m.get("owner_name");
                boolean canView = 
                    allowedUsage.equals("public") || 
                    (username != null && allowedUsage.equals("login")) ||
                    owner.equals(username);
                boolean canEdit = 
                    allowedEdit.equals("public") ||
                    (username != null && allowedEdit.equals("login")) ||
                    owner.equals(username);
                boolean canDelete = owner.equals(username);
                JsonObject jm = mapper.toJsonTree(m).getAsJsonObject();
                jm.remove("allowed_usage");
                jm.remove("allowed_edit");
                jm.remove("owner_name");
                jm.addProperty("r", canView);
                jm.addProperty("w", canEdit);
                jm.addProperty("d", canDelete);
                System.out.println(jm.toString());
                /* Get the thumbnail for public sites - restricted ones can have a thumbnail uploaded or use a placeholder */                
                String thumbUrl = THUMBNAIL_CACHE + "/bas.jpg"; 
                System.out.println(server);
                if (allowedUsage.equals("public") && !server.equals("localhost")) {
                    /* This is a publically-viewable map */
                    String genThumbUrl = THUMBNAIL_CACHE + "/" + getActiveProfile() + "/" + mapName + ".jpg";
                    String genThumbPath = context.getRealPath(genThumbUrl);
                    System.out.println(genThumbUrl);
                    System.out.println(genThumbPath);
                    File thumbnail = new File(genThumbPath);
                    if (!thumbnail.exists()) {
                        /* Retrieve an image from shrinktheweb.com and write it to the thumbnail cache */
                        /* Note: 2017-02-01 David - Need to use the STW advanced API which is a two-step process
                        https://support.shrinktheweb.com/Knowledgebase/Article/View/128/0/best-practice-method-to-get-screenshot-requests-as-soon-as-ready
                        https://shrinktheweb.com/uploads/STW_API_Documentation.pdf */
                        System.out.println("STW thumbnail generation not yet implemented");
                        try {
                            String mapUrl = server + "/" + (allowedUsage.equals("public") ? "home" : "restricted") + "/" + mapName;
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

                            // Create all-trusting host name verifier
                            HostnameVerifier allHostsValid = new HostnameVerifier() {
                                public boolean verify(String hostname, SSLSession session) {return true;}
                            };
                            // Install the all-trusting host verifier
                            HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);
                            HttpsURLConnection con = (HttpsURLConnection)stwUrl.openConnection();
                            con.setConnectTimeout(5000);
                            con.setReadTimeout(10000);
                            InputStream content = con.getInputStream();
                            byte[] buffer = new byte[4096];
                            int n = -1;
                            OutputStream fos = new FileOutputStream(thumbnail);
                            while ((n = content.read(buffer)) != -1) {
                                fos.write(buffer, 0, n);
                            }
                            fos.close();                            
                            thumbUrl = genThumbUrl;
                            System.out.println("Completed");
                        } catch(Exception ex) {
                            System.out.println("Exception");
                            System.out.println(ex.getMessage());
                        }                      
                    }                    
                }
                jm.addProperty("thumburl", server + thumbUrl);
                ja.add(jm);
            }
            ret = PackagingUtils.packageResults(HttpStatus.OK, ja.toString(), null);
        } else {
            /* No data is fine - simply return empty results array */
            ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
        }
        return(ret);
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
