/*
 * Latitude validator class
 */
package uk.ac.antarctica.mapengine.validator;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class LatitudeValidator implements ConstraintValidator<Latitude, Double> {
    
    private static final double TOLERANCE = 1e-05;
    private static final double MINLAT = -90.0;
    private static final double MAXLAT = 90.0;
 
    @Override
    public void initialize(Latitude constraintAnnotation) {        
    }
 
    @Override
    public boolean isValid(Double value, ConstraintValidatorContext context) {
        return(
                (value >= MINLAT && value <= MAXLAT)  ||
                (Math.abs(value - MINLAT) < TOLERANCE) || 
                (Math.abs(value - MAXLAT) < TOLERANCE)
        );
    }
    
}