/*
 * Custom authentication provider to allow login using Geoserver credentials
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.ParseException;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.LaxRedirectStrategy;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.exception.GeoserverAuthenticationException;

@Component
public class GeoserverAuthenticationProvider implements AuthenticationProvider {
    
    private String loginUrl;
    
    public GeoserverAuthenticationProvider() {
    }
    
    public GeoserverAuthenticationProvider(String loginUrl) {
        this.loginUrl = loginUrl;
    }
    
    @Override
    public Authentication authenticate(Authentication authentication) 
      throws GeoserverAuthenticationException {
        HttpResponse response = null;
        CloseableHttpClient client = HttpClientBuilder.create().setRedirectStrategy(new LaxRedirectStrategy()).build();
        String name = authentication.getName();
        String password = authentication.getCredentials().toString();
        try {
            /* If the request succeeds it will be because we have been sent to the login page */
            Request request = Request.Post(loginUrl + "/j_spring_security_check")
                .bodyString("username=" + name + "&password=" + password, ContentType.APPLICATION_FORM_URLENCODED);                
            response = Executor.newInstance(client).execute(request).returnResponse();
            String content = IOUtils.toString(response.getEntity().getContent());
            if (content.contains("Invalid username/password combination")) {
                throw new GeoserverAuthenticationException("Invalid credentials");
            } else {
                throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver");
            }
        } catch(ClientProtocolException cpe) {
            /* 302 redirection will come here, apparently because of a circular redirect detected - means we have authenticated ok! */
            return(new UsernamePasswordAuthenticationToken(name, password, null));
        } catch (IOException ioe) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - IOException was: " + ioe.getMessage());
        } catch (ParseException pe) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - ParseException was: " + pe.getMessage());
        } finally {
            try {
                client.close();
            } catch(IOException ioe) {
                throw new GeoserverAuthenticationException("IO exception authenticating against local Geoserver - error was: " + ioe.getMessage());
            }
        } 
    }
 
    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.equals(UsernamePasswordAuthenticationToken.class);
    }

    public String getLoginUrl() {
        return loginUrl;
    }

    public void seLoginUrl(String loginUrl) {
        this.loginUrl = loginUrl;
    }        
    
}
