package com.zextras.owncloud;

import org.openzal.zal.soap.*;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;

public class OwnCloudSOAPHandler implements SoapHandler
{
  static final private String sNAMESPACE     = "urn:zimbraAccount";
  static final         QName  sREQUEST_QNAME = new QName("ownCloud", sNAMESPACE);

  @Override
  public void handleRequest(
    ZimbraContext zimbraContext,
    SoapResponse soapResponse,
    ZimbraExceptionContainer zimbraExceptionContainer
  )
  {
//    String exampleParameter = zimbraContext.getParameter("paramName", "");
  }

  @Override
  public boolean needsAdminAuthentication(
    ZimbraContext zimbraContext
  )
  {
    return false;
  }

  @Override
  public boolean needsAuthentication(
    ZimbraContext zimbraContext
  )
  {
    return true;
  }
}
