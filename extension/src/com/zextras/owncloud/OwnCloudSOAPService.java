package com.zextras.owncloud;

import org.openzal.zal.soap.QName;
import org.openzal.zal.soap.SoapHandler;
import org.openzal.zal.soap.SoapService;

import java.util.HashMap;
import java.util.Map;

public class OwnCloudSOAPService implements SoapService
{
  @Override
  public Map<QName, ? extends SoapHandler> getServices()
  {
    return new HashMap<QName, SoapHandler>()
    {{
      put(OwnCloudSOAPHandler.sREQUEST_QNAME, new OwnCloudSOAPHandler());
    }};
  }

  @Override
  public String getServiceName()
  {
    return "ownCloudSOAPService";
  }

  @Override
  public boolean isAdminService()
  {
    return false;
  }
}
