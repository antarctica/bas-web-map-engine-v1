/*
 * Custom authentication provider to allow login using CCAMLR Drupal CHOCCHIPSSL cookie
 */
package uk.ac.antarctica.mapengine.config;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class CcamlrAuthenticationProvider implements AuthenticationProvider {
    
    public CcamlrAuthenticationProvider() {        
    }
              
    @Override
    public Authentication authenticate(Authentication authentication) {        
        return(authentication);
    }
 
    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.equals(UsernamePasswordAuthenticationToken.class);
    }

    
}
