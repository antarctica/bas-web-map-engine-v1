/*
 * Packaging for Geoserver authentication exceptions
 */
package uk.ac.antarctica.mapengine.exception;

import org.springframework.security.core.AuthenticationException;

public class GeoserverAuthenticationException extends AuthenticationException {

    public GeoserverAuthenticationException(String msg) {
        super(msg);
    }
        
}
