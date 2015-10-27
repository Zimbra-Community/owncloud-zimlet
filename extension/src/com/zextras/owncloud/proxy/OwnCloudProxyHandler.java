package com.zextras.owncloud.proxy;


import com.zextras.Zimlet;
import com.zextras.dav.ZimletProperty;
import com.zextras.util.UserPropertyExtractor;
import org.openzal.zal.Account;
import org.openzal.zal.AuthToken;
import org.openzal.zal.Provisioning;
import org.openzal.zal.Utils;
import org.openzal.zal.http.HttpHandler;
import org.openzal.zal.log.ZimbraLog;
import org.tuckey.web.filters.urlrewrite.*;

import javax.servlet.*;
import javax.servlet.http.*;
import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

public class OwnCloudProxyHandler implements HttpHandler
{
  public static final String sExtensionPath = "/service/extension/owncloud";
  private final Provisioning mProvisioning;

  public OwnCloudProxyHandler()
  {
    mProvisioning = new Provisioning();
  }

  public void doFilterResponse(
    HttpServletRequest httpServletRequest,
    HttpServletResponse httpServletResponse
  )
    throws ServletException, IOException
  {
    Account account = getAccount(httpServletRequest);
    URL serverUrl = getServerUrl(account);

    Conf conf  = new Conf();

    {
      NormalRule rule = new NormalRule();
      rule.setFrom("(^/" + serverUrl.getPath() + ".*)");
      rule.setTo(sExtensionPath + "/$1");
      conf.addRule(rule);

      OutboundRule outboundRule = new OutboundRule();
      outboundRule.setFrom("https?://" + serverUrl.getHost() + ":*[0-9]*/(.*)");
      outboundRule.setTo(sExtensionPath + "/$1");
      conf.addOutboundRule(outboundRule);
    }

    conf.initialise();
    UrlRewriter urlRewriter = new UrlRewriter(
      conf
    );

    String requestPath = new URL(httpServletRequest.getRequestURL().toString()).getPath();
    String requestQuery = httpServletRequest.getQueryString();

    String targetUrl = serverUrl.toExternalForm()+requestPath.replace(sExtensionPath, "");
    if( requestQuery != null && !requestQuery.isEmpty() )
    {
      targetUrl += "?"+requestQuery;
    }

    try
    {
      UrlRewriteWrappedResponse responseWrapper = new UrlRewriteWrappedResponse(
        httpServletResponse,
        httpServletRequest,
        urlRewriter
      ){
        @Override
        public void setHeader(String key, String value)
        {
          if( "Location".equalsIgnoreCase(key) )
          {
            super.setHeader(key, super.encodeRedirectURL(value) );
          }
          else
          {
            super.setHeader(key, value);
          }
        }

        @Override
        public void addHeader(String key, String value)
        {
          if( "Location".equalsIgnoreCase(key) )
          {
            super.addHeader(key, super.encodeRedirectURL(value) );
          }
          else
          {
            super.addHeader(key, value);
          }
        }
      };

      ContentFilterWrapper htmlContentFilter = new ContentFilterWrapper(
        responseWrapper
      );

      RequestProxy.execute(
        targetUrl,
        httpServletRequest,
        htmlContentFilter
      );

      htmlContentFilter.filterAndFlush();
    }
    catch (Throwable ex)
    {
      ZimbraLog.extensions.error(Utils.exceptionToString(ex));
    }
  }

  @Override
  public void doGet(
    HttpServletRequest httpServletRequest,
    HttpServletResponse httpServletResponse
  )
    throws ServletException, IOException
  {
    doFilterResponse(
      httpServletRequest,
      httpServletResponse
    );
  }

  /**
   * Handle the POST response.
   * @param httpServletRequest The request.
   * @param httpServletResponse The response.
   * @throws ServletException
   * @throws IOException
   */
  @Override
  public void doPost(
    HttpServletRequest httpServletRequest,
    HttpServletResponse httpServletResponse
  )
    throws ServletException, IOException
  {
    doFilterResponse(
      httpServletRequest,
      httpServletResponse
    );
  }

  /**
   * Handle the OPTIONS request.
   * @param httpServletRequest The request.
   * @param httpServletResponse The response.
   * @throws ServletException
   * @throws IOException
   */
  @Override
  public void doOptions(
    HttpServletRequest httpServletRequest,
    HttpServletResponse httpServletResponse
  )
    throws ServletException, IOException
  {
    doFilterResponse(
      httpServletRequest,
      httpServletResponse
    );
  }

  /**
   * Get the path where the handler will be registered.
   * Outside will be exposed at the url "${server}/service/extension/${url}"
   * @return The path
   */
  @Override
  public String getPath()
  {
    return "/owncloud";
  }

  /**
   * Extract the account starting from the authtoken of the request.
   * @param httpServletRequest The request.
   * @return The account
   */
  private Account getAccount(HttpServletRequest httpServletRequest)
  {
    String authTokenStr = null;
    try
    {
      Cookie[] cookies = httpServletRequest.getCookies();
      for (int n = 0; n < cookies.length; ++n)
      {
        Cookie cookie = cookies[n];

        if (cookie.getName().equals("ZM_AUTH_TOKEN"))
        {
          authTokenStr = cookie.getValue();
          break;
        }
      }
    } catch (Exception ex)
    {
      ex.printStackTrace();
    }

    AuthToken authToken = AuthToken.getAuthToken(authTokenStr);
    return mProvisioning.getAccountById(authToken.getAccountId());
  }

  /**
   * Get the URL for the server stored into the account.
   * @param account The Account
   * @return The URL
   */
  private URL getServerUrl(Account account)
  {
    final Map<String, String> userProperties = UserPropertyExtractor.getZimletUserProperties(account, Zimlet.NAME);
    if (
        userProperties.get(ZimletProperty.DAV_SERVER_NAME) == null ||
        userProperties.get(ZimletProperty.DAV_SERVER_PORT) == null ||
        userProperties.get(ZimletProperty.DAV_SERVER_PATH) == null ||
        userProperties.get(ZimletProperty.DAV_USER_USERNAME) == null ||
        userProperties.get(ZimletProperty.DAV_USER_PASSWORD) == null
      )
    {
      throw new RuntimeException("DAV Data connection not set for user '" + account.getName() + "'");
    }
    int port = Integer.parseInt(userProperties.get(ZimletProperty.DAV_SERVER_PORT));
//    String username = userProperties.get(ZimletProperty.DAV_USER_USERNAME);
//    String password = userProperties.get(ZimletProperty.DAV_USER_PASSWORD);
    final URL url;
    try
    {
      url = new URL(userProperties.get(ZimletProperty.DAV_SERVER_NAME) + ":" + port);
    } catch (MalformedURLException e)
    {
      throw new RuntimeException(e);
    }
    return url;
  }
}
