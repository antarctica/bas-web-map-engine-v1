/*
 * Generalised URL connector, hiding details of SSL etc
 */
package uk.ac.antarctica.mapengine.util;

import java.io.IOException;
import java.io.InputStream;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import javax.net.ssl.SSLContext;
import org.apache.commons.httpclient.HttpStatus;
import org.apache.http.HttpHeaders;
import org.apache.http.HttpResponse;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;

public class GenericUrlConnector {

    private static final int CONNECT_TIMEOUT_MILLIS = 10000;
    private static final int REQUEST_TIMEOUT_MILLIS = 10000;
    
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

        if (secure) {
            /* Secure URL */
            SSLContext sslContext = new SSLContextBuilder()
                .loadTrustMaterial(null, (certificate, authType) -> true).build();

            client = HttpClients.custom()
                .setDefaultRequestConfig(config)
                .setSslcontext(sslContext)
                .setSSLHostnameVerifier(new NoopHostnameVerifier())
                .build();
        } else {
            /* Non-secure */
            client = HttpClientBuilder
                .create()
                .setDefaultRequestConfig(config)
                .build();
        }
    }

    /**
     * GET from given URL, with optional basic authentication     
     * @param String url
     * @param String username
     * @param String password
     * @return int status code
     * @throws IOException
     */
    public int get(String url, String username, String password)  {
        
        int status;
        
        HttpGet request = new HttpGet(url);
        if (username != null && password != null) {
            /* Create Basic Authentication header */
            String authHeader = "Basic " + new String(Base64.getEncoder().encode((username + ":" + password).getBytes()));
            request.setHeader(HttpHeaders.AUTHORIZATION, authHeader);            
        }
        try {
            HttpResponse response = getClient().execute(request);
            status = response.getStatusLine().getStatusCode();
            setContent(response.getEntity().getContent());
        } catch (IOException ioe) {
            System.out.println("Failed to get response from " + url + ", error was : " + ioe.getMessage());
            status = HttpStatus.SC_INTERNAL_SERVER_ERROR;
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
