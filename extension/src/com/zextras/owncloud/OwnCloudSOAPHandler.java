package com.zextras.owncloud;


import org.json.JSONArray;
import org.json.JSONObject;
import org.openzal.zal.Account;
import org.openzal.zal.Provisioning;
import org.openzal.zal.soap.*;

import java.io.IOException;

public class OwnCloudSOAPHandler implements SoapHandler
{
  private static String NAMESPACE = "urn:zimbraAccount";
  public static final QName REQUEST_QNAME = new QName("ownCloud", NAMESPACE);

  private final Provisioning mProvisioning;

  public OwnCloudSOAPHandler()
  {
    mProvisioning = new Provisioning();
  }

  @Override
  public void handleRequest(
    ZimbraContext zimbraContext,
    SoapResponse soapResponse,
    ZimbraExceptionContainer zimbraExceptionContainer
  )
  {
    final String accountId = zimbraContext.getAuthenticatedAccontId();
    final Account account = mProvisioning.assertAccountById(accountId);
    final OwnCloudSoapConnector connector = new OwnCloudSoapConnector(account);

    final String actionStr = zimbraContext.getParameter("action", "");
    final OwnCloudCommand command;
    try
    {
      command = OwnCloudCommand.fromString(actionStr);
    } catch (RuntimeException ex)
    {
      handleError(ex, soapResponse, zimbraExceptionContainer);
      return;
    }

    try
    {
      switch (command)
      {
        case GET_ALL_SHARES:
          connector.getAllShares(soapResponse);
          break;
        case GET_SHARES_FROM_FOLDER:
          String path = zimbraContext.getParameter("path", "");
          path = path.replace(" ", "%20");
          String reshares = zimbraContext.getParameter("reshares", "false");
          String subfiles = zimbraContext.getParameter("subfiles", "true");
          if (path.equals("")) { throw new RuntimeException("Missing 'path' argument for '" + command.name() + "' command."); }

          connector.getSharesFromFolder(
            soapResponse,
            path,
            reshares.toLowerCase().equals("true"),
            subfiles.toLowerCase().equals("true")
          );
          break;
        case GET_SHARE_BY_ID:
          int shareId = Integer.parseInt(zimbraContext.getParameter("shareId", ""));
          connector.getShareById(
            soapResponse,
            shareId
          );
          break;
        default:
          throw new RuntimeException("OwnCloud command '" + command.name() + "' not handled.");
      }
    } catch (IOException ex)
    {
      zimbraExceptionContainer.setException(ex);
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
  public boolean needsAdminAuthentication(ZimbraContext zimbraContext)
  {
    return false;
  }

  /**
   * If the user needs to be authenticated to use this handler.
   * @param zimbraContext The zimbra context.
   * @return If the user needs to be authenticated.
   */
  @Override
  public boolean needsAuthentication(ZimbraContext zimbraContext)
  {
    return true;
  }
}
