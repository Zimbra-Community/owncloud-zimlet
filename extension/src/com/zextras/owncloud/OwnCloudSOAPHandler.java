package com.zextras.owncloud;


import com.zextras.SoapUtil;
import com.zextras.owncloud.client.ShareType;
import org.openzal.zal.Account;
import org.openzal.zal.Provisioning;
import org.openzal.zal.soap.*;

import java.io.IOException;

public class OwnCloudSOAPHandler implements SoapHandler
{
  private static String NAMESPACE = "urn:zimbraAccount";
  public static final QName REQUEST_QNAME = new QName("ownCloud", NAMESPACE);

  private final Provisioning mProvisioning;

  public OwnCloudSOAPHandler(Provisioning provisioning)
  {
    mProvisioning = provisioning;
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
    final OwnCloudSoapConnector connector = new OwnCloudSoapConnector(account, zimbraContext);

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
          {
            connector.getAllShares(soapResponse);
          }
          break;
        case GET_SHARES_FROM_FOLDER:
          {
            String path = zimbraContext.getParameter("path", "");
            if (path.equals(""))
            {
              throw new RuntimeException("Missing 'path' argument for '" + command.name() + "' command.");
            }
            path = path.replace(" ", "%20");
            String reshares = zimbraContext.getParameter("reshares", "false");
            String subfiles = zimbraContext.getParameter("subfiles", "true");

            connector.getSharesFromFolder(
              soapResponse,
              path,
              reshares.toLowerCase().equals("true"),
              subfiles.toLowerCase().equals("true")
            );
          }
          break;
        case GET_SHARE_BY_ID:
          {
            int shareId = Integer.parseInt(zimbraContext.getParameter("shareId", "-1"));
            if (shareId == -1)
            {
              throw new RuntimeException("Missing 'shareId' argument for '" + command.name() + "' command.");
            }
            connector.getShareById(
              soapResponse,
              shareId
            );
          }
          break;
        case CREATE_SHARE:
          String path = zimbraContext.getParameter("path", "");
          if (path.equals(""))
          {
            throw new RuntimeException("Missing 'path' argument for '" + command.name() + "' command.");
          }
          ShareType shareType = ShareType.fromCode(Integer.parseInt(zimbraContext.getParameter("shareType", "")));
          String shareWith = null;
          if ((shareType == ShareType.USER || shareType == ShareType.GROUP) && shareWith == null)
          {
            throw new RuntimeException("Missing 'shareType' argument for '" + command.name() + "' command with share type '" + shareType.name() + "'.");
          }
          boolean publicUpload = Boolean.parseBoolean(zimbraContext.getParameter("publicUpload", "false"));
          String password = zimbraContext.getParameter("password", null);
          Permission permissions;
          if (shareType == ShareType.PUBLIC_LINK)
          {
            permissions = Permission.fromCode(Integer.parseInt(zimbraContext.getParameter("permissions", "1")));
          }
          else
          {
            permissions = Permission.fromCode(Integer.parseInt(zimbraContext.getParameter("permissions", "31")));
          }
          connector.createShare(
            soapResponse,
            path,
            shareType,
            shareWith,
            publicUpload,
            password,
            permissions
          );
          break;
        case DELETE_SHARE_BY_ID:
          {
            int shareId = Integer.parseInt(zimbraContext.getParameter("shareId", "-1"));
            if (shareId == -1)
            {
              throw new RuntimeException("Missing 'shareId' argument for '" + command.name() + "' command.");
            }
            connector.deleteShareById(soapResponse, shareId);
          }
          break;
        case UPDATE_SHARE:
          int shareId = Integer.parseInt(zimbraContext.getParameter("shareId", "-1"));
          if (shareId == -1)
          {
            throw new RuntimeException("Missing 'shareId' argument for '" + command.name() + "' command.");
          }
          connector.updateShare(
            soapResponse,
            shareId,
            zimbraContext.getParameter("permissions", null),
            zimbraContext.getParameter("password", null),
            zimbraContext.getParameter("publicUpload", null),
            zimbraContext.getParameter("expireDate", null)
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
    resp.setValue("error", SoapUtil.encodeError(error).toString());
    errorContainer.setException(error);
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
