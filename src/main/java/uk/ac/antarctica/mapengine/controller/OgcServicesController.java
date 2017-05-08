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
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.apache.http.NameValuePair;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URLEncodedUtils;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.context.ServletContextAware;

@Controller
public class OgcServicesController implements ServletContextAware {        
    
    @Autowired
    Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    private static final int SOCKET_TIMEOUT = 60000;
    
    private static final int CONNECT_TIMEOUT = 60000;
    
    /* Servlet context */
    private ServletContext context; 
    
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
            throw new ServletException("Exception : " + dae.getMessage() + ", probably due to non-existent service id");
        }        
    }
    
    /**
     * WMS proxy
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param Map<String, Object> servicedata
     */
    private void callWms(HttpServletRequest request, HttpServletResponse response, Map<String, Object> servicedata) throws ServletException, IOException {
        
        String mimeType = null;                
        List<NameValuePair> params = decomposeQueryString(request);
        
        String operation = getQueryParameter(params, "request");
        if (operation == null) {
            throw new ServletException("Query string >" + request.getQueryString() + "< contains no 'request' parameter");
        }
        
        try {
            switch(operation.toLowerCase()) {
                case "getcapabilities": 
                    /* GetCapabilities document in text/xml */
                    String version = getQueryParameter(params, "version");
                    getFromUrl(response, servicedata.get("url") + "?service=wms&request=getcapabilities" + (version != null ? "&version=" + version : ""), mimeType, false);
                    mimeType = "text/xml";
                    break;
                case "getmap":
                    mimeType = getQueryParameter(params, "format");
                    if (mimeType == null) {
                        mimeType = "image/png";
                    }
                    getFromUrl(response, servicedata.get("url") + "?" + request.getQueryString(), mimeType, true);
                    break;
                case "getfeatureinfo":
                    mimeType = getQueryParameter(params, "info_format");
                    if (mimeType == null) {
                        mimeType = "application/json";
                    }
                    getFromUrl(response, servicedata.get("url") + "?" + request.getQueryString(), mimeType, true);
                    break;
                default:
                    throw new ServletException("Unsupported WMS operation : " + operation);
            }
        } catch(RestrictedDataException rde) {
            InputStream ogcContent = null;
            if (operation.toLowerCase().equals("getmap")) {
                /* Output 256x256 transparent PNG image informing user of restricted access */
                mimeType = "image/png";
                String[] annotations = new String[] {
                    "Layer " + getQueryParameter(params, "layers"),
                    "contains restricted data",
                    "log in to view"
                };
                BufferedImage bi = new BufferedImage(256, 256, BufferedImage.TRANSLUCENT);
                Graphics g = bi.getGraphics();
                g.setColor(new Color(1f, 1f, 1f, 0.5f));
                g.fillRect(0, 0, 256, 256);
                g.setFont(new Font("Arial", Font.PLAIN, 14));
                g.setColor(new Color(1f, 0f, 0f, 1.0f));
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
                mimeType = "application/json";
                String jsonOut = "{\"status\":401,\"message\":\"" + rde.getMessage() + "\"}";
                response.setContentType(mimeType);
                ogcContent = new ByteArrayInputStream(jsonOut.getBytes(StandardCharsets.UTF_8));
                IOUtils.copy(ogcContent, response.getOutputStream());
                ogcContent.close();
            }                        
        }        
    }
    
    /**
     * WFS proxy
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param Map<String, Object> servicedata
     */
    private void callWfs(HttpServletRequest request, HttpServletResponse response, Map<String, Object> servicedata) throws ServletException, IOException {                
                
        if ((Boolean)servicedata.get("has_wfs")) {
            /* Service offers WFS - assume that the URL is a simple swap of 'wfs' for 'wms' at the end */            
            List<NameValuePair> params = decomposeQueryString(request);        
            String operation = getQueryParameter(params, "request");
            if (operation == null) {
                throw new ServletException("Query string >" + request.getQueryString() + "< contains no 'request' parameter");
            }
            String endpointUrl = (String)servicedata.get("url");
            if (endpointUrl.endsWith("/")) {
                endpointUrl = endpointUrl.substring(0, endpointUrl.length()-1);
            }
            String wfsUrl = "";
            if (!endpointUrl.endsWith("wfs")) {
                if (endpointUrl.endsWith("wms")) {
                    wfsUrl = endpointUrl.replaceFirst("wms$", "wfs");
                } else {
                    wfsUrl = endpointUrl + "/wfs";
                }                
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
                String jsonOut = "{\"status\":401,\"message\":\"" + rde.getMessage() + "\"}";
                response.setContentType("application/json");
                IOUtils.copy(new ByteArrayInputStream(jsonOut.getBytes(StandardCharsets.UTF_8)), response.getOutputStream());
            }
        } else {
            throw new ServletException("Service does not allow WFS"); 
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
     * Retrieve optionally restricted content from the given URL by means of an http(s) GET
     * @param HttpServletResponse response
     * @param String url
     * @param String mimeType
     * @param boolean secured
     * @throws IOException, RestrictedDataException
     */
    private void getFromUrl(HttpServletResponse response, String url, String mimeType, boolean secured) throws IOException, RestrictedDataException { 
                
        HttpClientBuilder builder = HttpClients.custom();
                
        if (secured) {
            String[] credentials = getOnwardCredentials(url);
            if (credentials != null) {
                /* Stored credentials for authenmtication to a Geoserver instance */
                CredentialsProvider credsProvider = new BasicCredentialsProvider();
                credsProvider.setCredentials(
                    new AuthScope(AuthScope.ANY),
                    new UsernamePasswordCredentials(credentials[0], credentials[1]));
                builder.setDefaultCredentialsProvider(credsProvider);
            }
        }
        
        if (url.startsWith("https://")) {
            /* SSL - override SSL checking
             * See http://stackoverflow.com/questions/13626965/how-to-ignore-pkix-path-building-failed-sun-security-provider-certpath-suncertp */
            try {
                System.setProperty ("jsse.enableSNIExtension", "false");
                TrustManager[] trustAllCerts = new TrustManager[] {new X509TrustManager() {
                    @Override
                    public java.security.cert.X509Certificate[] getAcceptedIssuers() {return null;}
                    @Override
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    @Override
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }};
                SSLContext sc = SSLContext.getInstance("SSL");
                sc.init(null, trustAllCerts, new java.security.SecureRandom());
                /* Create all-trusting host name verifier */
                HostnameVerifier allHostsValid = new HostnameVerifier() {
                    @Override
                    public boolean verify(String hostname, SSLSession session) {return true;}
                };
                builder.setSSLSocketFactory(new SSLConnectionSocketFactory(sc, allHostsValid));
            } catch(KeyManagementException | NoSuchAlgorithmException ex) {
                return;
            }
        }     
               
        try (CloseableHttpClient httpclient = builder.build()) {
            RequestConfig requestConfig = RequestConfig.custom()
                .setSocketTimeout(SOCKET_TIMEOUT)
                .setConnectTimeout(CONNECT_TIMEOUT)
                .setConnectionRequestTimeout(CONNECT_TIMEOUT)
                .build();
            HttpGet httpget = new HttpGet(url);
            httpget.setConfig(requestConfig);
            try (CloseableHttpResponse httpResponse = httpclient.execute(httpget)) {
                int status = httpResponse.getStatusLine().getStatusCode();
                if (status == 401) {
                    throw new RestrictedDataException("You are not authorised to access this resource");
                }
                response.setContentType(mimeType);
                IOUtils.copy(httpResponse.getEntity().getContent(), response.getOutputStream());
            }
        }
    }
    
    /**
     * Retrieve credentials stored at user login time which reside in the local SecurityContext
     * @param String url
     * @return String[]
     */
    private String[] getOnwardCredentials(String url) {        
        for (GrantedAuthority ga : SecurityContextHolder.getContext().getAuthentication().getAuthorities()) {
            if (ga.getAuthority().startsWith("geoserver:")) {
                String[] creds = ga.getAuthority().split(":");
                String applyToHost = creds[1];
                if (url.contains("localhost") || url.startsWith("http://" + applyToHost) || url.startsWith("https://" + applyToHost)) {
                    if (creds.length == 4) {
                        return(new String[]{creds[2], creds[3]});                 
                    }
                }
            }
        }
        return(null);
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

    @Override
    public void setServletContext(ServletContext sc) {
        this.context = sc;
    }
    
    public class RestrictedDataException extends Exception {
        public RestrictedDataException(String message) {
            super(message);
        }
    }

}
