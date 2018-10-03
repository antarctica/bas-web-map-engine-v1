/*
 * Longitude
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
@Constraint(validatedBy = { LongitudeValidator.class })
public @interface Longitude {
    
    String message() default "This is not a valid longitude in range -180.0 -> +180.0";
 
    Class<?>[] groups() default {};
 
    Class<? extends Payload>[] payload() default {};
 
}