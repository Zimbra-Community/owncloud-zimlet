package com.zextras.dav;

import com.zextras.SoapUtil;
import com.zextras.Zimlet;
import com.zextras.util.UserPropertyExtractor;
import org.openzal.zal.Account;
import org.openzal.zal.Provisioning;
import org.openzal.zal.soap.*;
import org.openzal.zal.soap.QName;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * SOAP Handler to interface a class which act as a client, with the SOAP infrastructure.
 */
public class DavSOAPHandler implements SoapHandler
{
  private static String NAMESPACE = "urn:zimbraAccount";
  public static final QName REQUEST_QNAME = new QName("davSoapConnector", NAMESPACE);

  private final Provisioning mProvisioning;
  private final Map<String, DownloadJob> mDownloadJobMap;

  public DavSOAPHandler(Provisioning provisioning, Map<String, DownloadJob> downloadJobMap)
  {
    mProvisioning = provisioning;
    mDownloadJobMap = downloadJobMap;
  }

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
    final String accountId = zimbraContext.getAuthenticatedAccontId();
    final Account account = mProvisioning.assertAccountById(accountId);

    final Map<String, String> userProperties = UserPropertyExtractor.getZimletUserProperties(account, Zimlet.NAME);

    final URL serverUrl;
    try
    {
      serverUrl = new URL(zimbraContext.getParameter("owncloud_zimlet_server_name", ""));
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

    final DavSoapConnector connector = new DavSoapConnector(
      zimbraContext.getParameter("owncloud_zimlet_server_name", ""),
      Integer.parseInt(zimbraContext.getParameter("owncloud_zimlet_server_port", "")),
      zimbraContext.getParameter("owncloud_zimlet_server_path", ""),
      zimbraContext.getParameter("owncloud_zimlet_username", ""),
      zimbraContext.getParameter("owncloud_zimlet_password", ""),
      zimbraContext.getRequesterIp()
    );

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

    try
    {
      switch (command)
      {
        case GET:
          {
            soapResponse.setValue(
              command.name(),
              connector.get(
                zimbraContext.getParameter("path", "/")
              ).toString()
            );
          }
          break;
        case GET_LINK:
        {
          DownloadJob job = new DownloadJob(
            connector,
            zimbraContext.getParameter("path", "/")
          );
          while (mDownloadJobMap.containsKey(job.getToken()))
          {
            job.regenerateToken();
          }
          mDownloadJobMap.put(job.getToken(), job);
          soapResponse.setValue(
            command.name(),
            job.getDownloadUrl()
          );
        }
        break;
        case PUT:
          {
            if (path == null)
            {
              throw new RuntimeException("Path not provided for PUT DAV action.");
            }
            String data = zimbraContext.getParameter("data", null);
            String contentType = zimbraContext.getParameter("contentType", "text/xml,charset=UTF-8");
            DavStatus status = connector.put(
              path,
              new ByteArrayInputStream(data.getBytes(StandardCharsets.UTF_8)),
              contentType
            );
            soapResponse.setValue(command.name(), status.getCode());
          }
          break;
        case PROPFIND:
          {
            soapResponse.setValue(
              command.name(),
              connector.propfind(
                zimbraContext.getParameter("path", "/"),
                Integer.parseInt(zimbraContext.getParameter("depth", "1"))
              ).toString()
            );
          }
          break;
        case DELETE:
          {
            if (path == null)
            {
              throw new RuntimeException("Path not provided for DELETE DAV action.");
            }
            connector.delete(path);
            soapResponse.setValue(command.name(), true);
          }
          break;
        case MKCOL:
          {
            if (path == null)
            {
              throw new RuntimeException("Path not provided for MKCOL DAV action.");
            }
            DavStatus status = connector.mkcol(path);
            soapResponse.setValue(command.name(), status.getCode());
          }
          break;
        case COPY:
          {
            if (path == null)
            {
              throw new RuntimeException("Source path not provided for COPY DAV action.");
            }
            String cpDestPath = zimbraContext.getParameter("destPath", null);
            if (cpDestPath == null)
            {
              throw new RuntimeException("Destination path not provided for COPY DAV action.");
            }
            boolean cpOverwrite = Boolean.parseBoolean(zimbraContext.getParameter("overwrite", "false"));
            connector.copy(path, cpDestPath, cpOverwrite);
            soapResponse.setValue(command.name(), true);
          }
          break;
        case MOVE:
          {
            if (path == null)
            {
              throw new RuntimeException("Source path not provided for MOVE DAV action.");
            }
            String mvDestPath = zimbraContext.getParameter("destPath", null);
            if (mvDestPath == null)
            {
              throw new RuntimeException("Destination path not provided for MOVE DAV action.");
            }
            boolean mvOverwrite = Boolean.parseBoolean(zimbraContext.getParameter("overwrite", "false"));
            connector.move(path, mvDestPath, mvOverwrite);
            soapResponse.setValue(command.name(), true);
          }
          break;
        case SEARCH:
        {
          if (path == null)
          {
            throw new RuntimeException("Source path not provided for SEARCH DAV action.");
          }
          String search = zimbraContext.getParameter("search", null);
          if (search == null)
          {
            throw new RuntimeException("No search string provided for SEARCH DAV action.");
          }

          soapResponse.setValue(
                  command.name(),
                  connector.search(
                          search,
                          path
                  ).toString()
          );

        }
        break;
        default:
          throw new RuntimeException("DAV command '" + command.name() + "' not handled.");
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
