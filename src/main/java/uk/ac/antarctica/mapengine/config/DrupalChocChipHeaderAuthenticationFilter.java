/*
 * Custom filter to authenticate a CCAMLR user via the Drupal CHOCCHIPSSL cookie
 * Based around http://shout.setfive.com/2015/11/02/spring-boot-authentication-with-custom-http-header/
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.security.Principal;
import java.util.ArrayList;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.codehaus.plexus.util.cli.CommandLineException;
import org.codehaus.plexus.util.cli.CommandLineUtils;
import org.codehaus.plexus.util.cli.Commandline;
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
    
    private boolean isCcamlr = false;
    
    public DrupalChocChipHeaderAuthenticationFilter(boolean isCcamlr) {
        this.isCcamlr = isCcamlr;
    }
        
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain fc) throws ServletException, IOException {
        if (isCcamlr) {
            String userName = getCcamlrUserName(request);
            if (userName != null) {
                System.out.println("CCAMLR user " + userName + " is logged in");
                Principal loggedInUser = request.getUserPrincipal();
                if (loggedInUser == null || !loggedInUser.getName().equals(userName)) {
                    System.out.println("Setting authentication context...");
                    ArrayList<GrantedAuthority> authorities = new ArrayList();
                    GrantedAuthority ga = new SimpleGrantedAuthority("ROLE_CCAMLR");
                    authorities.add(ga);
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userName, "password", authorities));
                }
            } else {
                /* Probably logged out */
                System.out.println("No CCAMLR user logged in => clear context");
                SecurityContextHolder.clearContext();
            }
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
                //System.out.println("Found CHOCOLATECHIP cookie " + cchip);
                Commandline cmd = new Commandline();
                CommandLineUtils.StringStreamConsumer phpOut = new CommandLineUtils.StringStreamConsumer();
                CommandLineUtils.StringStreamConsumer phpErr = new CommandLineUtils.StringStreamConsumer();
                cmd.setExecutable(PHP_PATH);
                cmd.createArg().setValue(this.getServletContext().getRealPath("/WEB-INF/ccamlr/unencryptChocChip.php"));
                cmd.createArg().setValue(cchip);
                int ret = CommandLineUtils.executeCommandLine(cmd, phpOut, phpErr, 10);
                if (ret == 0) {
                    String phpSer = phpOut.getOutput().replace("\n", "");                    
                    userName = getCcamlrName(phpSer);
                } else {
                    System.out.println("Non-zero return code (" + ret + ") from unencryptChocChip.php");
                }
			}			
		} catch(UnsupportedEncodingException ex) {
        } catch (CommandLineException cle) {
            System.out.println("Command line exception: " + cle.getMessage());
        }
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
