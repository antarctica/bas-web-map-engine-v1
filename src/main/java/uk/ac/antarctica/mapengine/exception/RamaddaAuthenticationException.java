/*
 * Packaging for Ramadda exceptions
 */
package uk.ac.antarctica.mapengine.exception;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.UNAUTHORIZED)
public class RamaddaAuthenticationException extends AuthenticationException {

    public RamaddaAuthenticationException(String msg) {
        super(msg);
    }
        
}
