package com.zextras.util;

import org.openzal.zal.Account;
import org.openzal.zal.Cos;

import java.net.URL;
import java.util.*;

/**
 * Utility class which help to extract information from Account Object.
 */
public class UserPropertyExtractor
{
  private static String A_zimbraProxyAllowedDomains = "zimbraProxyAllowedDomains";
  private static String A_zimbraZimletUserProperties = "zimbraZimletUserProperties";
  private static String A_zimbraZimletAvailableZimlets = "zimbraZimletAvailableZimlets";

  /**
   * Get all the zimlet user properties, filtered for a specific zimlet.
   * @param account The source account
   * @param filterBy The name of the zimlet
   * @return The set of the properties of the zimlet.
   */
  public static Map<String, String> getZimletUserProperties(Account account, String filterBy)
  {
    final Map<String, String> propSet = new HashMap<String, String>();

    for (String property : account.getMultiAttrSet(A_zimbraZimletUserProperties))
    {
      if (property.startsWith(filterBy + ":"))
      {
        String rawProperty = property.substring(filterBy.length() + 1);
        String[] strings = rawProperty.split(":", 2);
        propSet.put(strings[0], strings[1]);
      }
    }
    return propSet;
  }

  public static boolean checkPermissionOnTarget(URL target, Account account) {
    Set<String> domains = account.getMultiAttrSet(A_zimbraProxyAllowedDomains);
    Cos cos = account.getCOS();
    if (cos != null)
    {
      domains.addAll(cos.getMultiAttrSet(A_zimbraProxyAllowedDomains));
    }
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
  }
}
