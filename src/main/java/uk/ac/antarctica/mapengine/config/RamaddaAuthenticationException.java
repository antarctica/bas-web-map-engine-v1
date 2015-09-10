/*
 * Packaging for Ramadda exceptions
 */
package uk.ac.antarctica.mapengine.config;

import org.springframework.security.core.AuthenticationException;

public class RamaddaAuthenticationException extends AuthenticationException {

    public RamaddaAuthenticationException(String msg) {
        super(msg);
    }
        
}
