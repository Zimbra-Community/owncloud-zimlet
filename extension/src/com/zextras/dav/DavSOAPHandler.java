package com.zextras.dav;

import org.json.JSONArray;
import org.json.JSONObject;
import org.openzal.zal.soap.*;
import org.openzal.zal.soap.QName;

import java.io.IOException;

/**
 * SOAP Handler to interface a class which act as a client, with the SOAP infrastructure.
 */
public class DavSOAPHandler implements SoapHandler
{
  static final private String sNAMESPACE     = "urn:zimbraAccount";
  static final         QName  sREQUEST_QNAME = new QName("davSoapConnector", sNAMESPACE);

  /**
   * Handle a SOAP request.
   * @param zimbraContext The zimbra contest
   * @param soapResponse The response container for the SOAP request
   * @param zimbraExceptionContainer
   */
  @Override
  public void handleRequest(
    ZimbraContext zimbraContext,
    SoapResponse soapResponse,
    ZimbraExceptionContainer zimbraExceptionContainer
  )
  {
    final String actionStr = zimbraContext.getParameter("action", "");
    final String path = zimbraContext.getParameter("path", null);
    final DavCommand command;
    try
    {
      command = DavCommand.fromString(actionStr);
    } catch (RuntimeException ex)
    {
      handleError(ex, soapResponse, zimbraExceptionContainer);
      return;
    }

    // TODO: Get this data from the account config.
    final DavSoapConnector connector = new DavSoapConnector(
      "https://files.planetbud.net",
      443,
      "/remote.php/webdav/",
      "zimbra",
      "z1i2m3b4r5a"
    );

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
          if (path == null)
          {
            throw new RuntimeException("Path not provided for DELETE DAV action.");
          }
          connector.delete(path);
          soapResponse.setValue("DELETE", true);
          break;
        case MKCOL:
          if (path == null)
          {
            throw new RuntimeException("Path not provided for MKCOL DAV action.");
          }
          connector.mkcol(path);
          soapResponse.setValue("MKCOL", true);
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
    } catch (IOException ex)
    {
      handleError(ex, soapResponse, zimbraExceptionContainer);
    }
  }

  /**
   * Encode an error into a JSON Object.
   * @param error The error which will be encoded.
   * @param resp The response container
   */
  private static void handleError(
    Exception error,
    SoapResponse resp,
    ZimbraExceptionContainer errorContainer
  )
  {
    resp.setValue("error", encodeError(error).toString());
    errorContainer.setException(error);
  }

  private static JSONObject encodeError(Throwable error)
  {
    JSONObject errorObj = new JSONObject();
    JSONArray stackArr = new JSONArray();
    for (StackTraceElement el : error.getStackTrace()) {
      stackArr.put(el.toString());
    }
    errorObj.put("message", error.getMessage());
    errorObj.put("trace", stackArr);
    if (error.getCause() != null)
    {
      errorObj.put("cause", encodeError(error.getCause()));
    }
    return errorObj;
  }

  /**
   * If the user needs to be authenticated as admin to use this handler.
   * @param zimbraContext The zimbra context.
   * @return If the user needs to be an administrator.
   */
  @Override
  public boolean needsAdminAuthentication(
    ZimbraContext zimbraContext
  )
  {
    return false;
  }

  /**
   * If the user needs to be authenticated to use this handler.
   * @param zimbraContext The zimbra context.
   * @return If the user needs to be authenticated.
   */
  @Override
  public boolean needsAuthentication(
    ZimbraContext zimbraContext
  )
  {
    return true;
  }
}
