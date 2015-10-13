package com.zextras.dav;

import org.openzal.zal.soap.QName;
import org.openzal.zal.soap.SoapHandler;
import org.openzal.zal.soap.SoapService;

import java.util.HashMap;
import java.util.Map;


public class DavSOAPService implements SoapService
{
  private final HashMap<QName, SoapHandler> mServiceMap;

  public DavSOAPService()
  {
    mServiceMap = new HashMap<QName, SoapHandler>()
    {{
      put(DavSOAPHandler.sREQUEST_QNAME, new DavSOAPHandler());
    }};
  }

  @Override
  public Map<QName, ? extends SoapHandler> getServices()
  {
    return mServiceMap;
  }

  @Override
  public String getServiceName()
  {
    return "SoapServlet";
  }

  @Override
  public boolean isAdminService()
  {
    return false;
  }
}
