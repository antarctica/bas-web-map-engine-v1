/*
 * Latitude
 */
package uk.ac.antarctica.mapengine.validator;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import javax.validation.Constraint;
import javax.validation.Payload;

@Target({ElementType.METHOD, ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = { LatitudeValidator.class })
public @interface Latitude {
    
    String message() default "This is not a valid latitude in range -90.0 -> +90.0";
 
    Class<?>[] groups() default {};
 
    Class<? extends Payload>[] payload() default {};
 
}