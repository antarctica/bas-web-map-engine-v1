/*
 * Json mapping/parser beans for the Spring context
 */
package uk.ac.antarctica.mapengine.config;

import com.google.gson.Gson;
import com.google.gson.JsonParser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JsonConfig {

    @Bean    
    public Gson jsonMapper() {
        return new Gson();
    }

    @Bean
    public JsonParser jsonParser() {
        return (new JsonParser());
    }

}
