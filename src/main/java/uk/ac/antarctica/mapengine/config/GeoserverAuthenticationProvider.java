/*
 * Custom authentication provider to allow login using Geoserver credentials
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import java.net.URLEncoder;
import org.apache.http.HttpResponse;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Form;
import org.apache.http.client.fluent.Request;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.LaxRedirectStrategy;
import org.apache.http.util.EntityUtils;
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
            /* Use the credentials to try to authenticate against local Ramadda installation */
            Request request = Request.Post(loginUrl + "/j_spring_security_check")                
                .addHeader("Content-type", "application/x-www-form-urlencoded")                
                .bodyForm(Form.form().add("username", name).add("password", URLEncoder.encode(password, "UTF-8")).build())
                .connectTimeout(60000)
                .socketTimeout(60000);            
            response = Executor.newInstance(client).execute(request).returnResponse();
            int code = response.getStatusLine().getStatusCode();
            if (code < 400) {
                String content = EntityUtils.toString(response.getEntity(), "UTF-8");
                //TODO
                return(new UsernamePasswordAuthenticationToken(name, password, null));
                /* Returned HTML content differs from simple XML listed in the published API http://geoport.whoi.edu/repository/userguide/developer/publishapi.html
                 * Compromise here is to check for the absence of the login form in the returned HTML - I think the problem is something to do with the 
                 * 302 redirect code from the raw URL */
//                if (!content.contains("form  method=\"post\"  action=\"" + this.loginUrl + "\"")) {
//                    Header[] scHeader = response.getHeaders("Set-Cookie");
//                    if (scHeader.length > 0) {
//                        String hval = scHeader[0].getValue();
//                        System.out.println(hval);
//                        SimpleGrantedAuthority ga = new SimpleGrantedAuthority(hval.substring(0, hval.indexOf(";")));
//                        List<GrantedAuthority> grantedAuths = new ArrayList<>();
//                        grantedAuths.add(ga);
//                        return(new UsernamePasswordAuthenticationToken(name, password, grantedAuths));
//                    } else {
//                        throw new GeoserverAuthenticationException("Failed to get Geoserver session id from response");
//                    }                                        
//                }
            } else {
                throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - response code was " + code);
            }
        } catch(Exception ex) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - error was: " + ex.getMessage());
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
