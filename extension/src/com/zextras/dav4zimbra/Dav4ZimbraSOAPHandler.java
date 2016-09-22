package com.zextras.dav4zimbra;

import com.zextras.SoapUtil;
import com.zextras.Zimlet;
import com.zextras.dav.DavStatus;
import com.zextras.dav.ZimletProperty;
import com.zextras.util.UserPropertyExtractor;
import org.openzal.zal.Account;
import org.openzal.zal.MailItemType;
import org.openzal.zal.MailboxManager;
import org.openzal.zal.Provisioning;
import org.openzal.zal.soap.*;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

/**
 * SOAP Handler to interface a class which act as a client, with the SOAP infrastructure.
 */
public class Dav4ZimbraSOAPHandler implements SoapHandler
{
  private static String NAMESPACE = "urn:zimbraAccount";
  public static final QName REQUEST_QNAME = new QName("dav4zimbra", NAMESPACE);

  private final Provisioning mProvisioning;
  private MailboxManager mMailboxManager;

  public Dav4ZimbraSOAPHandler(MailboxManager mailboxManager, Provisioning provisioning)
  {
    mMailboxManager = mailboxManager;
    mProvisioning = provisioning;
  }

  /**
   * Handle a SOAP request.
   * @param zimbraContext The zimbra contest.
   * @param soapResponse The response container for the SOAP request.
   * @param zimbraExceptionContainer The Zimbra Exception Container.
   */
  @Override
  public void handleRequest(
    ZimbraContext zimbraContext,
    SoapResponse soapResponse,
    ZimbraExceptionContainer zimbraExceptionContainer
  )
  {
    final String zimbraAccountId = zimbraContext.getAuthenticatedAccontId();
    final Account account = mProvisioning.assertAccountById(zimbraAccountId);

    final Map<String, String> userProperties = UserPropertyExtractor.getZimletUserProperties(account, Zimlet.NAME);

    if (
      userProperties.get(ZimletProperty.DAV_SERVER_NAME) == null ||
      userProperties.get(ZimletProperty.DAV_SERVER_PORT) == null ||
      userProperties.get(ZimletProperty.DAV_SERVER_PATH) == null ||
      userProperties.get(ZimletProperty.DAV_USER_USERNAME) == null
      )
    {
      handleError(
        new RuntimeException("DAV Data connection not set for user '" + account.getName() + "'"),
        soapResponse,
        zimbraExceptionContainer
      );
      return;
    }

    {
      final URL serverUrl;
      try
      {
        serverUrl = new URL(userProperties.get(ZimletProperty.DAV_SERVER_NAME));
      } catch (MalformedURLException e)
      {
        handleError(e, soapResponse, zimbraExceptionContainer);
        return;
      }
      if (!UserPropertyExtractor.checkPermissionOnTarget(serverUrl, account))
      {
        handleError(
          new RuntimeException("Proxy domain not allowed '" + serverUrl + "' for user '" + account.getName() + "'"),
          soapResponse,
          zimbraExceptionContainer
        );
        return;
      }
    }

    final Dav4ZimbraConnector connector = new Dav4ZimbraConnector(
      mMailboxManager,
      userProperties.get(ZimletProperty.DAV_SERVER_NAME),
      Integer.parseInt(userProperties.get(ZimletProperty.DAV_SERVER_PORT)),
      zimbraContext.getParameter("targetFolder", userProperties.get(ZimletProperty.DAV_SERVER_PATH)),
      userProperties.get(ZimletProperty.DAV_USER_USERNAME),
      zimbraContext.getParameter("dav_user_password", ""),
      userProperties.get(ZimletProperty.DAV_MAIL_FOLDER)
    );

    final String actionStr = zimbraContext.getParameter("action", "");
//    final String path = zimbraContext.getParameter("path", null);
    final Dav4ZimbraCommand command;
    try
    {
      command = Dav4ZimbraCommand.fromString(actionStr);
    } catch (RuntimeException ex)
    {
      handleError(ex, soapResponse, zimbraExceptionContainer);
      return;
    }

    try
    {
      switch (command)
      {
        case SEND_ITEM_TO_DAV:
          {
            String typeString = zimbraContext.getParameter("itemType", null);
            if (typeString == null)
            {
              throw new RuntimeException("Item type not provided for SEND_ITEM_TO_DAV action.");
            }
            String idString = zimbraContext.getParameter("itemId", null);
            if (idString == null)
            {
              throw new RuntimeException("Item ID not provided for SEND_ITEM_TO_DAV action.");
            }
            DavStatus status = connector.sendItemToDav(
              zimbraAccountId,
              MailItemType.of(typeString),
              Integer.parseInt(idString)
            );
            soapResponse.setValue(command.value(), status.getCode());
          }
          break;
        case SEND_MAIL_ATTACHMENT_TO_DAV:
          String midString = zimbraContext.getParameter("mid", null);
          if (midString == null)
          {
            throw new RuntimeException("Item type not provided for SEND_ITEM_TO_DAV action.");
          }
          String partString = zimbraContext.getParameter("part", null);
          if (partString == null)
          {
            throw new RuntimeException("Item ID not provided for SEND_ITEM_TO_DAV action.");
          }
          String fileNameString = zimbraContext.getParameter("fileName", null);
          DavStatus status = connector.sendMailAttachmentToDav(
            zimbraAccountId,
            Integer.parseInt(midString),
            partString,
            fileNameString
          );
          soapResponse.setValue(command.value(), status.getCode());
          break;
        default:
          throw new RuntimeException("Dav4Zimbra command '" + command.name() + "' not handled.");
      }
    } catch (Exception ex)
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
    resp.setValue("error", SoapUtil.encodeError(error).toString());
    errorContainer.setException(error);
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
