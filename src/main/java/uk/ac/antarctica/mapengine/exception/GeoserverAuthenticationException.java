/*
 * Packaging for Geoserver authentication exceptions
 */
package uk.ac.antarctica.mapengine.exception;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.UNAUTHORIZED)
public class GeoserverAuthenticationException extends AuthenticationException {

    public GeoserverAuthenticationException(String msg) {
        super(msg);
    }
        
}
