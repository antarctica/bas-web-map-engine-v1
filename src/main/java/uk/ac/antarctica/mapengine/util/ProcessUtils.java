/*
 * Utility methods for handling process calls
 */
package uk.ac.antarctica.mapengine.util;

import java.io.IOException;
import java.io.InputStream;
import java.util.Scanner;

public class ProcessUtils {
    
    /**
     * Execute a command - see http://stackoverflow.com/questions/7348711/recommended-way-to-get-hostname-in-java
     * @param String execCommand
     * @return
     * @throws IOException 
     */
    public static String execReadToString(String execCommand) throws IOException {
        Process proc = Runtime.getRuntime().exec(execCommand);
        try (InputStream stream = proc.getInputStream()) {
            try (Scanner s = new Scanner(stream).useDelimiter("\\A")) {
                return s.hasNext() ? s.next() : "";
            }
        }
    }
    
}
