/*
 * Longitude validator class
 */
package uk.ac.antarctica.mapengine.validator;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class LongitudeValidator implements ConstraintValidator<Longitude, Double> {
 
    private static final double TOLERANCE = 1e-05;
    private static final double MINLON = -180.0;
    private static final double MAXLON = 180.0;
 
    @Override
    public void initialize(Longitude constraintAnnotation) {        
    }
 
    @Override
    public boolean isValid(Double value, ConstraintValidatorContext context) {
        return(
                (value >= MINLON && value <= MAXLON)  ||
                (Math.abs(value - MINLON) < TOLERANCE) || 
                (Math.abs(value - MAXLON) < TOLERANCE)
        );
    }
    
}