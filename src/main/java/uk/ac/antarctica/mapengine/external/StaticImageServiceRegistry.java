/*
 * Registry of image services
 */
package uk.ac.antarctica.mapengine.external;

import java.util.HashMap;

public class StaticImageServiceRegistry {
    
    HashMap<String,StaticImageService> registry = new HashMap();
    
    public StaticImageServiceRegistry() {        
    } 
    
    public void register(String serviceData) {
        String[] services = serviceData.split(",");
        for (int i = 0; i < services.length; i += 2) {
            String serviceName = services[i];
            String serviceClassName = services[i+1];
            try {
                StaticImageService service = (StaticImageService)Class.forName("uk.ac.antarctica.mapengine.external." + serviceClassName).newInstance();
                registry.put(serviceName, service);
            } catch(Exception ex) {
                System.out.println("Failed to instantiate class " + serviceClassName + ", error was " + ex.getMessage());
            }
        }        
    }
    
    public HashMap<String,StaticImageService> getRegistry() {
        return(registry);
    }
    
}
