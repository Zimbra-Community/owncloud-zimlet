package com.zextras.dav4zimbra;


import org.openzal.zal.MailboxManager;
import org.openzal.zal.Provisioning;
import org.openzal.zal.soap.QName;
import org.openzal.zal.soap.SoapHandler;
import org.openzal.zal.soap.SoapService;

import java.util.HashMap;
import java.util.Map;

/**
 * DAV for Zimbra SOAP Service.
 * This class register a series fo soap handlers for the extension.
 */
public class Dav4ZimbraSOAPService implements SoapService
{
  /**
   * Map containing the handlers and their names.
   * Zimlets can connect to these handlers using the address /service/soap/{qname}
   */
  private final HashMap<QName, SoapHandler> mServiceMap;

  public Dav4ZimbraSOAPService(final MailboxManager mailboxManager, final Provisioning provisioning)
  {
    mServiceMap = new HashMap<QName, SoapHandler>()
    {{
      put(Dav4ZimbraSOAPHandler.REQUEST_QNAME, new Dav4ZimbraSOAPHandler(mailboxManager, provisioning));
    }};
  }

  /**
   * Get the map of the handlers.
   * @return The map of the handlers.
   */
  @Override
  public Map<QName, ? extends SoapHandler> getServices()
  {
    return mServiceMap;
  }

  /**
   * Get the type of the service where handlers will be registered.
   * @return The type of the service where handlers will be registered.
   */
  @Override
  public String getServiceName()
  {
    return "SoapServlet";
  }

  /**
   * Register the service as administrative service handler.
   * @return If the service is created for administrative purpose.
   */
  @Override
  public boolean isAdminService()
  {
    return false;
  }
}
