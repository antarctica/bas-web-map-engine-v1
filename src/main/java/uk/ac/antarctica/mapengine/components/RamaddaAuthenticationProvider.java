/*
 * Custom authentication provider to allow login using Ramadda credentials
 */
package uk.ac.antarctica.mapengine.components;

import uk.ac.antarctica.mapengine.exception.RamaddaAuthenticationException;
import java.util.ArrayList;
import java.util.List;
import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.client.fluent.Request;
import org.apache.http.util.EntityUtils;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

@Component
public class RamaddaAuthenticationProvider implements AuthenticationProvider {
       
    private String loginUrl;
    
    public RamaddaAuthenticationProvider() {
    }
    
    public RamaddaAuthenticationProvider(String loginUrl) {
        this.loginUrl = loginUrl;
    }
    
    @Override
    public Authentication authenticate(Authentication authentication) 
      throws RamaddaAuthenticationException {
        String name = authentication.getName();
        String password = authentication.getCredentials().toString();
        try {
            /* Use the credentials to try to authenticate against local Ramadda installation */
            String loginUrl = this.loginUrl + "?output=xml&user.password=" + password + "&user.id=" + name;
            HttpResponse response = Request.Get(loginUrl)
                .connectTimeout(60000)
                .socketTimeout(60000)
                .execute()
                .returnResponse();
            int code = response.getStatusLine().getStatusCode();
            if (code == 200) {
                String content = EntityUtils.toString(response.getEntity(), "UTF-8");
                /* Returned HTML content differs from simple XML listed in the published API http://geoport.whoi.edu/repository/userguide/developer/publishapi.html
                 * Compromise here is to check for the absence of the login form in the returned HTML - I think the problem is something to do with the 
                 * 302 redirect code from the raw URL */
                if (!content.contains("form  method=\"post\"  action=\"" + this.loginUrl + "\"")) {
                    Header[] scHeader = response.getHeaders("Set-Cookie");
                    if (scHeader.length > 0) {
                        String hval = scHeader[0].getValue();
                        System.out.println(hval);
                        SimpleGrantedAuthority ga = new SimpleGrantedAuthority(hval.substring(0, hval.indexOf(";")));
                        List<GrantedAuthority> grantedAuths = new ArrayList<>();
                        grantedAuths.add(ga);
                        return(new UsernamePasswordAuthenticationToken(name, password, grantedAuths));
                    } else {
                        throw new RamaddaAuthenticationException("Failed to get Ramadda session id from response");
                    }                                        
                }
            } else {
                throw new RamaddaAuthenticationException("Unable to authenticate against local Ramadda - response code was " + code);
            }
        } catch(Exception ex) {
            throw new RamaddaAuthenticationException("Unable to authenticate against local Ramadda - error was: " + ex.getMessage());
        } 
        return(null);
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
