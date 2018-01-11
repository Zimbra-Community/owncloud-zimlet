package com.zextras.util;

import org.openzal.zal.Account;
import org.openzal.zal.Cos;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.URL;
import java.util.*;

/**
 * Utility class which help to extract information from Account Object.
 */
public class UserPropertyExtractor {
  private static String A_zimbraProxyAllowedDomains = "zimbraProxyAllowedDomains";
  private static String A_zimbraZimletUserProperties = "zimbraZimletUserProperties";
  private static String A_zimbraZimletAvailableZimlets = "zimbraZimletAvailableZimlets";

  /**
   * Get all the zimlet user properties, filtered for a specific zimlet.
   *
   * @param account  The source account
   * @param filterBy The name of the zimlet
   * @return The set of the properties of the zimlet.
   */
  public static Map<String, String> getZimletUserProperties(Account account, String filterBy) {
    final Map<String, String> propSet = new HashMap<String, String>();

    for (String property : account.getMultiAttrSet(A_zimbraZimletUserProperties)) {
      if (property.startsWith(filterBy + ":")) {
        String rawProperty = property.substring(filterBy.length() + 1);
        String[] strings = rawProperty.split(":", 2);
        propSet.put(strings[0], strings[1]);
      }
    }
    return propSet;
  }

  public static boolean checkPermissionOnTarget(URL target, Account account) {

    Properties prop = new Properties();
    try {
      FileInputStream input = new FileInputStream("/opt/zimbra/lib/ext/ownCloud/config.properties");
      prop.load(input);

      String[] temp = prop.getProperty("allowdomains").split(";");
      Set<String> domains = new HashSet<String>(Arrays.asList(temp));

      input.close();

      String host = target.getHost().toLowerCase();
      for (String domain : domains) {
        if (domain.equals("*")) {
          return true;
        }
        if (domain.charAt(0) == '*') {
          domain = domain.substring(1);
        }
        if (host.endsWith(domain)) {
          return true;
        }
      }
      return false;
    } catch (IOException ex) {
      ex.printStackTrace();
      return false;
    }
  }

  /**
   * There has to be a better way to get the contents of zimbraMailTrustedIP but
   * haven't found it yet. So for now we put it in trustedIPs.properties and have the
   * installer update it.
   */
  public static boolean checkZimbraMailTrustedIP(String ip) {

    Properties prop = new Properties();
    try {
      FileInputStream input = new FileInputStream("/opt/zimbra/lib/ext/ownCloud/trustedIPs.properties");
      prop.load(input);

      String[] temp = prop.getProperty("zimbramailtrustedips").split(";");
      Set<String> zimbramailtrustedips = new HashSet<String>(Arrays.asList(temp));

      input.close();

      for (String zimbramailtrustedip : zimbramailtrustedips) {
        if(ip.equals(zimbramailtrustedip)) {
           return true;
        }
      }
      return false;
    } catch (Exception ex) {
      return false;
    }
  }

}