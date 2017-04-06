/*
 * Proxy API calls
 */

package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.net.URL;
import java.net.URLConnection;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.impl.auth.DigestScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ProxyController {        
    
    @Autowired
    Environment env;
    
    private static final String[] ALLOWED_HOSTS = new String[]{
        "ccamlr.org", "polarview.aq", "marine-geo.org", "bluehabitats.org", "gov.gs", "aad.gov.au", "ac.uk", "scar.org"
    };
    
    private static final HashMap<String, String> CREDENTIALS = new HashMap();
    static {        
        CREDENTIALS.put("http://tracker.aad.gov.au", "comnap:Koma5vudri:Tracker");
    }
    
    /* Cope with haproxy reverse proxying mess where some https:// URLs give Java "unrecognized_name" errors due to broken SSL implementation - David 2017-03-30 */
    private static final HashMap<String, String> ALIASES = new HashMap();
    static {
        ALIASES.put("https://polarcode.data.bas.ac.uk", "http://bslmagl.nerc-bas.ac.uk");
    }
    
   /**
     * Proxy for an authorised URL
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException 
     */
    @RequestMapping(value="/proxy", method=RequestMethod.GET)	
    public void proxy(HttpServletRequest request, HttpServletResponse response, @RequestParam(value="url", required=true) String url) 
        throws ServletException, IOException {
        
        boolean proxied = false;
        String errorMessage = "";
        
        /* test for alias substitution */
        for (String a : ALIASES.keySet()) {
            if (url.startsWith(a)) {
                url = url.replace(a, ALIASES.get(a));
            }
        }
        
        URL u = new URL(url);      
        
        for (String key : ALLOWED_HOSTS) {
            if (u.getHost().endsWith(key)) {
                /* Allowed to call this URL from here */
                switch(u.getProtocol()) {
                    case "http":
                        /* Non-SSL */
                        if (CREDENTIALS.containsKey(url)) {
                            /* Attempt authentication (basic/digest) */
                            String[] credParts = CREDENTIALS.get(url).split(":");
                            if (credParts.length == 2) {
                                /* Apply HTTP Basic Auth */
                                Executor executor = Executor.newInstance()                        
                                    .auth(new HttpHost(key), credParts[0], credParts[1]);                        
                                IOUtils.copy(executor.execute(Request.Get(url)
                                    .connectTimeout(60000)
                                    .socketTimeout(60000))
                                    .returnResponse().getEntity().getContent(), response.getOutputStream());
                                proxied = true;
                            } else if (credParts.length == 3) {
                                /* Apply HTTP Digest Auth */
                                URL obj = new URL(url);
                                URLConnection conn = obj.openConnection();
                                Map<String, List<String>> map = conn.getHeaderFields();
                                if (map.containsKey("WWW-Authenticate")) {
                                    String wwwAuth = map.get("WWW-Authenticate").get(0);
                                    if (!wwwAuth.isEmpty()) {
                                        /* Server returned a plausible header giving information on how to authenticate */
                                        System.out.println("Got WWW-Authenticate header : " + wwwAuth);
                                        HttpHost targetHost = new HttpHost(obj.getHost(), obj.getPort(), obj.getProtocol());
                                        CloseableHttpClient httpClient = HttpClients.createDefault();
                                        HttpClientContext context = HttpClientContext.create();
                                        CredentialsProvider credsProvider = new BasicCredentialsProvider();
                                        credsProvider.setCredentials(AuthScope.ANY, new UsernamePasswordCredentials(credParts[0], credParts[1]));
                                        AuthCache authCache = new BasicAuthCache();
                                        DigestScheme digestScheme = new DigestScheme();
                                        /* Extract the digest parameters */
                                        String[] kvps = wwwAuth.split(",\\s?");
                                        for (String kvp : kvps) {
                                            String[] kvArr = kvp.split("=");
                                            if (kvArr.length == 2) {
                                                String k = kvArr[0].replace("\\\\\"", "");
                                                String v = kvArr[1].replace("\\\\\"", "");
                                                if (k.toLowerCase().equals("digest realm")) {
                                                    k = "realm";
                                                }
                                                System.out.println("Set digest override parameter " + k + " to " + v);
                                                digestScheme.overrideParamter(k, v);
                                            }
                                        }
                                        authCache.put(new HttpHost(key), digestScheme);
                                        context.setCredentialsProvider(credsProvider);
                                        context.setAuthCache(authCache);
                                        HttpGet httpget = new HttpGet(url);
                                        CloseableHttpResponse httpResp = httpClient.execute(targetHost, httpget, context);
                                        IOUtils.copy(httpResp.getEntity().getContent(), response.getOutputStream());
                                        proxied = true;
                                    }
                                }                                
                            }
                        } else {
                            /* No authentication required */
                            IOUtils.copy(Request.Get(url)                    
                                .connectTimeout(60000)
                                .socketTimeout(60000)
                                .execute()
                                .returnResponse().getEntity().getContent(), response.getOutputStream());
                            proxied = true;
                        }
                        break;
                    case "https":
                        /* Note: authentication not implemented */
                        System.out.println("Proxy via https");
                        HttpsURLConnection conn = null;
                        try {                            
                            /* Override SSL checking
                             * See http://stackoverflow.com/questions/13626965/how-to-ignore-pkix-path-building-failed-sun-security-provider-certpath-suncertp */
                            System.setProperty ("jsse.enableSNIExtension", "false");
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
                            conn = (HttpsURLConnection)u.openConnection();
                            conn.setConnectTimeout(5000);
                            conn.setReadTimeout(10000);
                            IOUtils.copy(conn.getInputStream(), response.getOutputStream());
                            proxied = true;
                        } catch(IOException | KeyManagementException | NoSuchAlgorithmException ex) {
                            errorMessage = "Exception : " + ex.getMessage();
                        } finally {
                            if (conn != null) {
                                conn.disconnect();
                            }
                        }
                        break;
                    default:
                        errorMessage = "Unsupported URL protocol : " + u.getProtocol();
                }                                
                if (proxied) {                
                    break;
                }
            }     
        }
        if (!proxied) {
            if (errorMessage.isEmpty()) {
                errorMessage = "Not allowed to proxy : " + url;
            }
            throw new ServletException(errorMessage);
        }
    }
    
    /**
     * Get JSON data on issue <id> from Redmine
     * @param HttpServletRequest request,
     * @param HttpServletResponse response,
     * @param Integer id
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/redmine/{id}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void redmineIssue(HttpServletRequest request, HttpServletResponse response, @PathVariable("id") Integer id)
        throws ServletException, IOException, ServiceException {
        String content = HTTPUtils.get(
            env.getProperty("redmine.local.url") + "/issues/" + id + ".json", 
            env.getProperty("redmine.local.username"), 
            env.getProperty("redmine.local.password")
        );
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());         
    }
    
}
