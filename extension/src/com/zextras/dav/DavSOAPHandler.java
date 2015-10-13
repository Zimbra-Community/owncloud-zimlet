package com.zextras.dav;

import org.json.JSONArray;
import org.json.JSONObject;
import org.openzal.zal.soap.*;
import org.openzal.zal.soap.QName;

import java.io.IOException;

public class DavSOAPHandler implements SoapHandler
{
  static final private String sNAMESPACE     = "urn:zimbraAccount";
  static final         QName  sREQUEST_QNAME = new QName("davSoapConnector", sNAMESPACE);

  @Override
  public void handleRequest(
    ZimbraContext zimbraContext,
    SoapResponse soapResponse,
    ZimbraExceptionContainer zimbraExceptionContainer
  )
  {
    String actionStr = zimbraContext.getParameter("action", "");
    DavCommand command;
    try
    {
      command = DavCommand.fromString(actionStr);
    } catch (RuntimeException ex)
    {
      encodeError(ex, soapResponse);
      return;
    }

    DavSoapConnector connector = new DavSoapConnector(
      "https://files.planetbud.net",
      443,
      "/remote.php/webdav/",
      "zimbra",
      "z1i2m3b4r5a"
    );

    JSONObject resultContainer;
    try
    {
      switch (command)
      {
        case OPTIONS:
          soapResponse.setValue("OPTIONS", new JSONObject().toString());
          break;
        case GET:
          soapResponse.setValue(
            "GET",
            connector.get(
              zimbraContext.getParameter("path", "/")
            ).toString()
          );
          break;
        case PUT:
          soapResponse.setValue("PUT", new JSONObject().toString());
          break;
        case PROPFIND:
          soapResponse.setValue(
            "PROPFIND",
            connector.propfind(
              zimbraContext.getParameter("path", "/"),
              Integer.parseInt(zimbraContext.getParameter("depth", "1"))
            ).toString()
          );
          break;
        case DELETE:
          soapResponse.setValue("DELETE", new JSONObject().toString());
          break;
        case MKCOL:
          soapResponse.setValue("MKCOL", new JSONObject().toString());
          break;
        case COPY:
          soapResponse.setValue("COPY", new JSONObject().toString());
          break;
        case MOVE:
          soapResponse.setValue("MOVE", new JSONObject().toString());
          break;
        default:
          break;
      }
    } catch (IOException e)
    {
      encodeError(e, soapResponse);
    }
  }

  private void encodeError(Exception error, SoapResponse resp)
  {
    JSONObject errorObj = new JSONObject();
    errorObj.put("message", error.getMessage());
    JSONArray stackArr = new JSONArray();
    for (StackTraceElement el : error.getStackTrace()) {
      stackArr.put(el.toString());
    }
    errorObj.put("trace", stackArr.toString());
    resp.setValue("error", errorObj.toString());
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
