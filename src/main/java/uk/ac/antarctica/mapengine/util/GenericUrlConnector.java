/*
 * Generalised URL connector, hiding details of SSL etc
 */
package uk.ac.antarctica.mapengine.util;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import javax.net.ssl.SSLContext;
import org.apache.commons.httpclient.HttpStatus;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.auth.DigestScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.springframework.security.access.AccessDeniedException;

public class GenericUrlConnector {

    private static final int CONNECT_TIMEOUT_MILLIS = 30000;
    private static final int REQUEST_TIMEOUT_MILLIS = 60000;
    
    private CloseableHttpClient client = null;
       
    /**
     * Create a new HTTP client
     * @param  secure
     * @throws IOException
     * @throws NoSuchAlgorithmException
     * @throws KeyStoreException
     * @throws KeyManagementException 
     */
    public GenericUrlConnector(boolean secure) throws IOException, NoSuchAlgorithmException, KeyStoreException, KeyManagementException {

        RequestConfig config = RequestConfig.custom()
            .setConnectTimeout(CONNECT_TIMEOUT_MILLIS)
            .setConnectionRequestTimeout(CONNECT_TIMEOUT_MILLIS)
            .setSocketTimeout(REQUEST_TIMEOUT_MILLIS).build();

        /* https://stackoverflow.com/questions/34655031/javax-net-ssl-sslpeerunverifiedexception-host-name-does-not-match-the-certifica - answer by antonpp */
        SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(SSLContext.getDefault(), NoopHostnameVerifier.INSTANCE);
        
        Registry<ConnectionSocketFactory> registry = RegistryBuilder.<ConnectionSocketFactory>create()
            .register("http", new PlainConnectionSocketFactory())
            .register("https", sslsf)
            .build();
        PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager(registry);
        cm.setMaxTotal(100);
        
        client = HttpClients.custom()
            .setDefaultRequestConfig(config)
            .setSSLSocketFactory(sslsf)
            .setConnectionManager(cm)
            .build();
// Commented out September 2018 David - seems to lead to problems with e.g. PVAN server certificates
//        if (secure) {
//            /* Secure URL */
//            SSLContext sslContext = new SSLContextBuilder()
//                .loadTrustMaterial(null, (certificate, authType) -> true).build();
//
//            client = HttpClients.custom()
//                .setDefaultRequestConfig(config)
//                .setSslcontext(sslContext)
//                .setSSLHostnameVerifier(new NoopHostnameVerifier())
//                .build();
//        } else {
//            /* Non-secure */
//            client = HttpClientBuilder
//                .create()
//                .setDefaultRequestConfig(config)
//                .build();
//        }
// End of September 2018 commenting out
    }
    
    /***************************************************************************************************************************************
     * GET from given URL, with optional basic authentication     
     * @param url
     * @param username
     * @param password
     * @param wwwAuth
     * @return GenericUrlConnectorResponse status and content information
     * @throws IOException
     */
    public GenericUrlConnectorResponse get(String url, String username, String password, String wwwAuth) 
            throws MalformedURLException, IOException {
        return(execute(new HttpGet(url), username, password, wwwAuth));        
    }        
    
    public GenericUrlConnectorResponse get(String url, String username, String password) 
            throws MalformedURLException, IOException {
        return(get(url, username, password, null));
    }
    
    public GenericUrlConnectorResponse get(String url) 
            throws MalformedURLException, IOException {
        return(get(url, null, null, null));
    }
    
    /***************************************************************************************************************************************
     * POST to given URL, with optional basic authentication
     * @param url
     * @param postBody
     * @param contentType
     * @param username
     * @param password
     * @param wwwAuth
     * @return GenericUrlConnectorResponse status and content information
     * @throws IOException
     */
    public GenericUrlConnectorResponse post(String url, String postBody, String contentType, String username, String password, String wwwAuth) 
            throws MalformedURLException, IOException, AccessDeniedException {
        if (username == null || username.isEmpty() || password == null || password.isEmpty()) {
            throw new AccessDeniedException("Must supply valid credentials to do this");
        }
        HttpPost httpPost = new HttpPost(url);
        httpPost.setHeader("Content-type", contentType);
        httpPost.setEntity(new StringEntity(postBody));
        return(execute(httpPost, username, password, wwwAuth));        
    }        
    
    public GenericUrlConnectorResponse post(String url, String postBody, String username, String password) 
            throws MalformedURLException, IOException, AccessDeniedException {
        return(post(url, postBody, "application/json", username, password, null));
    }    
    
    /***************************************************************************************************************************************
     * PUT to given URL, with optional basic authentication
     * @param url
     * @param putBody
     * @param contentType
     * @param username
     * @param password
     * @param wwwAuth
     * @return GenericUrlConnectorResponse status and content information
     * @throws IOException
     */
    public GenericUrlConnectorResponse put(String url, String putBody, String contentType, String username, String password, String wwwAuth) 
            throws MalformedURLException, IOException, AccessDeniedException {
        if (username == null || username.isEmpty() || password == null || password.isEmpty()) {
            throw new AccessDeniedException("Must supply valid credentials to do this");
        }
        HttpPut httpPut = new HttpPut(url);
        httpPut.setHeader("Content-type", contentType);
        httpPut.setEntity(new StringEntity(putBody));
        return(execute(httpPut, username, password, wwwAuth));        
    }        
    
    public GenericUrlConnectorResponse put(String url, String putBody, String username, String password) 
            throws MalformedURLException, IOException, AccessDeniedException {
        return(put(url, putBody, "application/json", username, password, null));
    }    
    
    /***************************************************************************************************************************************
     * DELETE to given URL, with optional basic authentication
     * @param url
     * @param username
     * @param password
     * @param wwwAuth
     * @return GenericUrlConnectorResponse status and content information
     * @throws IOException
     */
    public GenericUrlConnectorResponse delete(String url, String username, String password, String wwwAuth) 
            throws MalformedURLException, IOException, AccessDeniedException {
        if (username == null || username.isEmpty() || password == null || password.isEmpty()) {
            throw new AccessDeniedException("Must supply valid credentials to do this");
        }
        return(execute(new HttpDelete(url), username, password, wwwAuth));        
    }        
    
    public GenericUrlConnectorResponse delete(String url, String username, String password) 
            throws MalformedURLException, IOException, AccessDeniedException {
        return(delete(url, username, password, null));
    }    
    
    /***************************************************************************************************************************************
     * Generic HTTP client request execution, with optional basic authentication/wwAuth digest
     * @param url
     * @param username
     * @param password
     * @param wwwAuth
     * @return GenericUrlConnectorResponse status and content information
     * @throws IOException
     */
    private GenericUrlConnectorResponse execute(HttpUriRequest request, String username, String password, String wwwAuth) 
            throws MalformedURLException, IOException {
        
        GenericUrlConnectorResponse gucOut = new GenericUrlConnectorResponse();
        
        gucOut.setStatus(HttpStatus.SC_OK);
        gucOut.setContent(null);
        
        String url = request.getURI().toURL().toString();
        
        HttpResponse response = null;
        
        HashMap<String, String> digestParms = new HashMap();
        
        if (digestAuthRequired(digestParms, wwwAuth)) {
            /* Set up for digest authentication */
            if (username == null || password == null) {
                System.out.println("Service at " + url + " requires digest authentication) but credentials were null");
                gucOut.setStatus(HttpStatus.SC_BAD_REQUEST);                
            }
            URL u = new URL(url);
            HttpHost targetHost = new HttpHost(u.getHost(), u.getPort(), u.getProtocol());
            HttpClientContext context = HttpClientContext.create();
            CredentialsProvider credsProvider = new BasicCredentialsProvider();
            credsProvider.setCredentials(AuthScope.ANY, new UsernamePasswordCredentials(username, password));            
            AuthCache authCache = new BasicAuthCache();
            DigestScheme digestScheme = new DigestScheme();
            digestParms.keySet().forEach((key) -> {
                digestScheme.overrideParamter(key, digestParms.get(key));
            });
            authCache.put(targetHost, digestScheme);
            context.setCredentialsProvider(credsProvider);
            context.setAuthCache(authCache);
            try {
                response = getClient().execute(targetHost, request, context);
            } catch(IOException ioe) {
                System.out.println("Failed to get response from " + url + " (digest authentication), error was : " + ioe.getMessage());
                gucOut.setStatus(HttpStatus.SC_BAD_REQUEST);
            }
        } else {
            if (username != null && password != null) {
                /* Create Basic Authentication header */
                String authHeader = "Basic " + new String(Base64.getEncoder().encode((username + ":" + password).getBytes()));
                request.setHeader(HttpHeaders.AUTHORIZATION, authHeader);
            }
            try {
                response = getClient().execute(request);
            } catch(IOException ioe) {
                System.out.println("Failed to get response from " + url + " (basic authentication), error was : " + ioe.getMessage());
                gucOut.setStatus(HttpStatus.SC_BAD_REQUEST);
            }            
        }
        if (response != null && gucOut.getStatus() == HttpStatus.SC_OK) {
            gucOut.setStatus(response.getStatusLine().getStatusCode());           
            try {
                gucOut.setContent(response.getEntity().getContent());                
            } catch(IOException ioe) {
                System.out.println("Failed to get content from " + url + ", error was : " + ioe.getMessage());
                gucOut.setStatus(HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }               
        return(gucOut);
    }
    
    /**
     * Close the client connection
     */
    public void close() {        
        try {
            client.close();
        } catch (IOException ioe) {
            System.out.println("Failed to close URL connection - exception was : " + ioe.getMessage());
        }
    }
    
    /**
     * Extract the digest parameters (careful that the nonce may contain an '=' sign!!)
     * @param  digestParms
     * @param  wwwAuth
     * @return 
     */
    private boolean digestAuthRequired(HashMap<String, String> digestParms, String wwwAuth) {
        
        boolean isDigest = false;
        
        if (wwwAuth != null && !wwwAuth.isEmpty()) {
            System.out.println("=== GenericUrlConnector.digestAuthRequired(): check key/value pairs from www-authenticate header "+ wwwAuth);            
            String[] kvps = wwwAuth.split(",\\s?");
            for (String kvp : kvps) {
                System.out.println("Processing: " + kvp + "...");
                /* Find the first '=' */
                int eq1 = kvp.indexOf("=");
                if (eq1 >= 0) {
                    String k = StringUtils.strip(kvp.substring(0, eq1), "\"");
                    String v = StringUtils.strip(kvp.substring(eq1+1), "\"");
                    if (k.toLowerCase().equals("digest realm")) {
                        k = "realm";
                    }
                    digestParms.put(k, v);
                    System.out.println("Set parameter " + k + " to " + v);
                }                
            }
            isDigest = digestParms.containsKey("nonce");
        }
        return(isDigest);
    }

    public CloseableHttpClient getClient() {
        return client;
    }

    public void setClient(CloseableHttpClient client) {
        this.client = client;
    }
    
    public class GenericUrlConnectorResponse {
        
        private int status;
        private InputStream content;

        public int getStatus() {
            return status;
        }

        public void setStatus(int status) {
            this.status = status;
        }

        public InputStream getContent() {
            return content;
        }

        public void setContent(InputStream content) {
            this.content = content;
        }        
        
    }

}
