/*
 * Proxy for readonly OGC service calls
 */

package uk.ac.antarctica.mapengine.controller;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.List;
import java.util.Map;
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
     * @param String operation (getmap|getfeatureinfo|getcapabilities|getfeature|describefeaturetype)
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/ogc/{serviceid}/{service}/{operation}", method = RequestMethod.GET)
    public void ogcGateway(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("serviceid") Integer serviceid,
        @PathVariable("service") String service,
        @PathVariable("operation") String operation
    ) throws ServletException, IOException, ServiceException {                
        try {
            Map<String, Object> servicedata = magicDataTpl.queryForMap(
                "SELECT * FROM " + env.getProperty("postgres.local.endpointsTable") + " WHERE id=?", 
                new Object[]{serviceid}, 
                Integer.class
            );
            switch(service) {
                case "wms":
                    callWms(request, response, servicedata, operation);
                    break;
                case "wfs":
                    callWfs(request, response, servicedata, operation);
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
     * @param String operation 
     */
    private void callWms(HttpServletRequest request, HttpServletResponse response, Map<String, Object> servicedata, String operation) throws ServletException, IOException {
        
        String mimeType = null;
        InputStream ogcContent = null;
        
        List<NameValuePair> params = decomposeQueryString(request);
        
        try {
            switch(operation.toLowerCase()) {
                case "getcapabilities": 
                    /* GetCapabilities document in text/xml */
                    String version = getQueryParameter(params, "version");
                    ogcContent = getFromUrl(servicedata.get("url") + "?service=wms&request=getcapabilities" + (version != null ? "&version=" + version : ""), false);
                    mimeType = "text/xml";
                    break;
                case "getmap":
                    mimeType = getQueryParameter(params, "format");
                    if (mimeType == null) {
                        mimeType = "image/png";
                    }
                    ogcContent = getFromUrl(servicedata.get("url") + "?" + request.getQueryString(), true);
                    break;
                case "getfeatureinfo":
                    mimeType = getQueryParameter(params, "info_format");
                    if (mimeType == null) {
                        mimeType = "application/json";
                    }
                    ogcContent = getFromUrl(servicedata.get("url") + "?" + request.getQueryString(), true);
                    break;
                default:
                    throw new ServletException("Unsupported WMS operation : " + operation);
            }
        } catch(RestrictedDataException rde) {
            if (operation.toLowerCase().equals("getmap")) {
                /* Output 256x256 transparent PNG image informing user of restricted access */
                mimeType = "image/png";
                File tpng = new File(context.getRealPath("/static/images/restricted_data.png"));
                ogcContent = new FileInputStream(tpng);
            } else {
                mimeType = "application/json";
                String jsonOut = "{\"status\":401,\"message\":\"" + rde.getMessage() + "\"}";
                ogcContent = new ByteArrayInputStream(jsonOut.getBytes(StandardCharsets.UTF_8));
            }
        }
        
        if (ogcContent != null && mimeType != null) {
            response.setContentType(mimeType);
            IOUtils.copy(ogcContent, response.getOutputStream());
            ogcContent.close();
        } else {
            throw new ServletException("Failed to retrieve remote WMS response");
        }
    }
    
    /**
     * WFS proxy
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param Map<String, Object> servicedata
     * @param String operation 
     */
    private void callWfs(HttpServletRequest request, HttpServletResponse response, Map<String, Object> servicedata, String operation) throws ServletException, IOException {
        
        String mimeType = null;
        InputStream ogcContent = null;
                
        if ((Boolean)servicedata.get("has_wfs")) {
            /* Service offers WFS - assume that the URL is a simple swap of 'wfs' for 'wms' at the end */            
            List<NameValuePair> params = decomposeQueryString(request);        
            String wfsUrl = ((String)servicedata.get("url")).replaceFirst("wms$", "wfs");
            
            try {
                switch(operation.toLowerCase()) {
                    case "getfeature":
                        mimeType = getQueryParameter(params, "outputformat");
                        if (mimeType == null) {
                            mimeType = "application/json";
                        }
                        ogcContent = getFromUrl(wfsUrl + "?" + request.getQueryString(), true);
                        break;
                    case "describefeaturetype":
                        mimeType = "text/xml";                   
                        ogcContent = getFromUrl(wfsUrl + "?" + request.getQueryString(), true);
                        break;                        
                    default:
                        throw new ServletException("Unsupported WFS operation : " + operation);
                }
            } catch(RestrictedDataException rde) {
                mimeType = "application/json";
                String jsonOut = "{\"status\":401,\"message\":\"" + rde.getMessage() + "\"}";
                ogcContent = new ByteArrayInputStream(jsonOut.getBytes(StandardCharsets.UTF_8)); 
            }
        } else {
            throw new ServletException("Service does not allow WFS"); 
        }
        
        if (ogcContent != null && mimeType != null) {
            response.setContentType(mimeType);
            IOUtils.copy(ogcContent, response.getOutputStream());
            ogcContent.close();
        } else {
            throw new ServletException("Failed to retrieve remote WMS response");
        }
    }
    
    /**
     * Break down the supplied query string into name/value pairs
     * @param HttpServletRequest request
     * @return List<NameValuePair>
     */
    private List<NameValuePair> decomposeQueryString(HttpServletRequest request) {
        return(URLEncodedUtils.parse(request.getQueryString(), Charset.defaultCharset()));
    }
    
    /**
     * Retrieve optionally restricted content from the given URL by means of an http(s) GET
     * @param String url
     * @param boolean secured
     * @return InputStream
     * @throws IOException 
     */
    private InputStream getFromUrl(String url, boolean secured) throws IOException, RestrictedDataException { 
        
        InputStream content = null;
        
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
                return(null);
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
            try (CloseableHttpResponse response = httpclient.execute(httpget)) {
                int status = response.getStatusLine().getStatusCode();
                if (status == 401) {
                    throw new RestrictedDataException("You are not authorised to access this resource");
                }
                content = response.getEntity().getContent();
            }
        }
        return(content);
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
                if (url.startsWith("http://" + applyToHost) || url.startsWith("https://" + applyToHost)) {
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
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }
    
    public class RestrictedDataException extends Exception {
        public RestrictedDataException(String message) {
            super(message);
        }
    }

}
