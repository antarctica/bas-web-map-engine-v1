/*
 * Custom filter to authenticate a CCAMLR user via the Drupal CHOCCHIPSSL cookie
 * Based around http://www.learningthegoodstuff.com/2014/12/spring-security-pre-authentication-and.html
 */
package uk.ac.antarctica.mapengine.config;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.ExecuteWatchdog;
import org.apache.commons.exec.PumpStreamHandler;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Handles CCAMLR request headers to extract usernames
 */
public class DrupalChocChipHeaderAuthenticationFilter extends OncePerRequestFilter {
    
    private static final String PHP_PATH = "/usr/bin/php";
        
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain fc) throws ServletException, IOException {
        String userName = getCcamlrUserName(request);
        if (userName != null) {
            ArrayList<GrantedAuthority> authorities = new ArrayList();
            GrantedAuthority ga = new SimpleGrantedAuthority("ROLE_CCAMLR");
            authorities.add(ga);
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userName, "password", authorities));
        }
        fc.doFilter(request, response);
    }
    
    /**
	 * Retrieve and parse the Bakery CHOCOLATECHIP cookie via a command-line PHP script
	 * @param HttpServletRequest request
	 * @return String	
	 */
	private String getCcamlrUserName(HttpServletRequest request) {
        
		String userName = null;        
        
		try {			
            String cchip = null;
            if (request.getCookies() != null) {
                for (Cookie c : request.getCookies()) {
                    if (c.getName().equals("CHOCOLATECHIPSSL")) {
                        cchip = URLDecoder.decode(c.getValue(), "UTF-8");
                        break;
                    }
                }
            }
            if (cchip != null) {
                /* Chocolate Chip cookie is present, indicating a Drupal login from a CCAMLR user */
                System.out.println("Found CHOCOLATECHIP cookie " + cchip);
                CommandLine cmd = new CommandLine(PHP_PATH);
                cmd.addArgument(this.getServletContext().getRealPath("/WEB-INF/ccamlr/unencryptChocChip.php"), true);
                cmd.addArgument(cchip, true);
                System.out.println("Executing PHP commandline : " + cmd.toString());
                DefaultExecutor executor = new DefaultExecutor();
                /* Send stdout and stderr to specific byte arrays so that the end user will get some feedback about the problem */
                ByteArrayOutputStream cmdStdout = new ByteArrayOutputStream();
                ByteArrayOutputStream cmdStderr = new ByteArrayOutputStream();
                PumpStreamHandler pumpStreamHandler = new PumpStreamHandler(cmdStdout, cmdStderr); 
                executor.setStreamHandler(pumpStreamHandler);
                executor.setExitValue(0);
                ExecuteWatchdog watchdog = new ExecuteWatchdog(30000);  /* Time process out after 30 seconds */
                executor.setWatchdog(watchdog);
                int exitValue = -1;
                try {         
                    executor.execute(cmd);
                    String phpSer = new String(cmdStderr.toByteArray(), StandardCharsets.UTF_8).replace("\n", "");						
                    System.out.println("Successful return - value retrieved was " + phpSer);
                    userName = getCcamlrName(phpSer);
                } catch (IOException ex) {
                    /* Report what the command wrote to stderr */
                    System.out.println("Error converting file : " + new String(cmdStderr.toByteArray(), StandardCharsets.UTF_8) + " exit value was " + exitValue);
                }
			}			
		} catch(UnsupportedEncodingException ex) {}
		System.out.println("Returning user name " + userName);
		return(userName);
	}
    
    /**
	 * Retrieve the user name (email address) from the PHP serialised form of the CCAMLR Drupal cookie
     * Sample output:
     * 
     * a:7:{s:4:"name";s:5:"darb1";s:4:"mail";s:15:"darb1@bas.ac.uk";s:4:"init";s:29:"www.ccamlr.org/user/1081/edit";s:6:"master";i:1;s:8:"calories";i:480;s:9:"timestamp";i:1369044938;s:4:"type";s:13:"CHOCOLATECHIP";}
     * 
     * All we want is the user name (darb1@bas.ac.uk in this case) so adopt a very simple-minded approach to retrieving it - note that we may want to retrieve other information
     * from PHP's serialised form e.g. user permission level, so a more complex method may be needed in future     
	 * @param String phpSer
	 * @return String
	 */
	private String getCcamlrName(String phpSer) {
		String name = "Unknown user";
		String[] parts = phpSer.split(";");
		if (parts.length > 3) {
			String[] subs = parts[3].split(":");
			if (subs.length > 2) {
				name = subs[2].replaceAll("\"", "");
			}
		}	
		return(name);
	}

}
