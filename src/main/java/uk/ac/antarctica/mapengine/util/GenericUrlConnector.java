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
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.auth.DigestScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;

public class GenericUrlConnector {

    private static final int CONNECT_TIMEOUT_MILLIS = 30000;
    private static final int REQUEST_TIMEOUT_MILLIS = 60000;
    
    private CloseableHttpClient client = null;
    
    private InputStream content = null;
    
    /**
     * Create a new HTTP client
     * @param boolean secure
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
            .setSSLSocketFactory(sslsf)
            .setConnectionManager(cm)
            .build();
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
    }

    /**
     * GET from given URL, with optional basic authentication     
     * @param String url
     * @param String username
     * @param String password
     * @param String wwwAuth
     * @return int status code
     * @throws IOException
     */
    public int get(String url, String username, String password, String wwwAuth) throws MalformedURLException, IOException {
        
        int status = HttpStatus.SC_OK;
        
        /* Tracking down certificate problem 2018/09/21 David */
        boolean isPvan = url.contains("polarview.aq");
        
        if (isPvan) {
            System.out.println("===== GET " + url);
        }
                
        HttpGet request = new HttpGet(url);
        HttpResponse response = null;
        
        HashMap<String, String> digestParms = new HashMap();
        
        if (digestAuthRequired(digestParms, wwwAuth)) {
            /* Set up for digest authentication */
            if (username == null || password == null) {
                System.out.println("Service at " + url + " requires digest authentication) but credentials were null");
                return(HttpStatus.SC_BAD_REQUEST);                
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
                status = HttpStatus.SC_BAD_REQUEST;
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
                status = HttpStatus.SC_BAD_REQUEST;
            }            
        }
        if (response != null && status == HttpStatus.SC_OK) {
            status = response.getStatusLine().getStatusCode();
            if (isPvan) {
                System.out.println("===== Status code was : " + status);
            }
            try {
                setContent(response.getEntity().getContent());
                if (isPvan) {
                    System.out.println("===== Got some content");
                }
            } catch(IOException ioe) {
                System.out.println("Failed to get content from " + url + ", error was : " + ioe.getMessage());
                status = HttpStatus.SC_INTERNAL_SERVER_ERROR;
            }
        }               
        return(status);
    }
    
    public void close() {        
        try {
            client.close();
        } catch (IOException ioe) {
            System.out.println("Failed to close URL connection - exception was : " + ioe.getMessage());
        }
    }
    
    /**
     * Extract the digest parameters (careful that the nonce may contain an '=' sign!!)
     * @param {HashMap<String,String>} digestParms
     * @param {String} wwwAuth
     * @return {boolean}
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

    public InputStream getContent() {
        return content;
    }

    public void setContent(InputStream content) {
        this.content = content;
    }        

}
