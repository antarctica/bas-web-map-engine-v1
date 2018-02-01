/*
 * Packaging for superuser-only authentication exceptions
 */
package uk.ac.antarctica.mapengine.exception;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.UNAUTHORIZED, reason = "Super users only permitted to do this")
public class SuperUserOnlyException extends AuthenticationException {

    public SuperUserOnlyException(String msg) {
        super(msg);
    }
        
}
