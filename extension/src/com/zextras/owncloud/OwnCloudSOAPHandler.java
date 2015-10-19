package com.zextras.owncloud;


import org.json.JSONArray;
import org.json.JSONObject;
import org.openzal.zal.Account;
import org.openzal.zal.Provisioning;
import org.openzal.zal.log.ZimbraLog;
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
        default:
          throw new RuntimeException("OwnCloud command '" + command.name() + "' not handled.");
      }
    } catch (IOException ex)
    {
      zimbraExceptionContainer.setException(ex);
    }

    ZimbraLog.mailbox.info("OwnCloud Client created");
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
