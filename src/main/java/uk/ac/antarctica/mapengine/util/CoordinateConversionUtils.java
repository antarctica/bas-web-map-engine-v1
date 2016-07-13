/*
 * Handy coordinate conversion utilities for working in dec degrees, DMS and DDM
 */
package uk.ac.antarctica.mapengine.util;

public class CoordinateConversionUtils {
    
    public static final double RESOLUTION = 1e-05;
    
    public static Double toDecDegrees(String coord, boolean isLat) {
        double dd, mm, ss; 
        String hh;
        Double convertedCoord = null;
        try {
            String[] parts = coord.split("[^0-9EWSNewsn.]");
            switch(parts.length) {
                case 4:
                case 3:
                    /* Assume DMS, either ddd mm ss.ss H or ddd mm ss.ssH */
                    dd = Double.valueOf(parts[0]);
                    mm = Double.valueOf(parts[1]);
                    ss = parts.length == 4 ? Double.valueOf(parts[2]) : Double.valueOf(parts[2].substring(0, parts[2].length() - 1));
                    hh = (parts.length == 4 ? parts[3] : parts[2].substring(parts[2].length() - 1)).toUpperCase();
                    if (validateCoordinate(dd, mm, ss, hh, isLat)) {
                        convertedCoord = (dd + mm / 60.0 + ss / 3600.0) * ((hh == "S" || hh == "W") ? -1.0 : 1.0);                       
                    }
                    break;
                case 2:
                    /* Assume DDM, Hddd mm.mm */
                    dd = Double.valueOf(parts[0].substring(1));
                    mm = Double.valueOf(parts[1]);
                    hh = parts[0].substring(0, 1);
                    if (validateCoordinate(dd, mm, 0.0, hh, isLat)) {
                        convertedCoord = (dd + mm / 60.0) * ((hh == "S" || hh == "W") ? -1.0 : 1.0);
                    }
                    break;
                default:
                    break;
            }
        } catch(NumberFormatException | NullPointerException nfe) {            
        }
        return(convertedCoord);
    }
    
    public static boolean validateCoordinate(double dd, double mm, double ss, String hh, boolean isLat) {
        double bdry = isLat ? 90.0 : 180.0; 
        boolean validh = isLat ? (hh.equals("N") || hh.equals("S")) : (hh.equals("E") || hh.equals("W"));
        return(
            ((dd > -bdry && dd < bdry) || withinResolution(dd, -bdry) || withinResolution(dd, bdry)) &&
            (mm >= 0.0 && mm <= 60.0) &&
            (ss >= 0.0 && ss <= 60.0) &&
            validh
        );
    }
       
    
    public static boolean withinResolution(double test, double value) {
        return(Math.abs(test - value) <= RESOLUTION);
    }
    
}
