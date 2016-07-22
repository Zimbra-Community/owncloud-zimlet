package com.zextras.owncloud.client;


import com.github.sardine.impl.SardineRedirectStrategy;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.NTCredentials;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.client.params.AuthPolicy;
import org.apache.http.config.Registry;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.HttpClientConnectionManager;
import org.apache.http.conn.SchemePortResolver;
import org.apache.http.conn.routing.HttpRoutePlanner;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.DefaultSchemePortResolver;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.impl.conn.SystemDefaultRoutePlanner;
import org.apache.http.util.VersionInfo;

import java.io.IOException;
import java.net.ProxySelector;

public class OwnCloudClient
{
  public static String OCS_SHARE_PATH = "ocs/v1.php/apps/files_sharing/api/v1";

  private final CloseableHttpClient mHttpClient;
  private final CredentialsProvider mCredentialsProvider;
  private final String mProtocol;
  private final String mServerName;
  private final int mPort;
  private final String mOcPrefix;

  public OwnCloudClient(
    String protocol,
    String serverName,
    int port,
    String ocPrefix,
    String username,
    String password
  )
  {
    mProtocol = protocol;
    mServerName = serverName;
    mPort = port;
    mOcPrefix = ocPrefix;
    mCredentialsProvider = getCredentialsProvider(username, password, null, null);
    mHttpClient = clientBuilder(null, mCredentialsProvider).build();
  }

  public void close()
    throws IOException
  {
    mHttpClient.close();
  }

  public String getOCSSharesUrl()
  {
    return mProtocol + "://" +
      mCredentialsProvider.getCredentials(AuthScope.ANY).getUserPrincipal().getName() +
      ":" + mCredentialsProvider.getCredentials(AuthScope.ANY).getPassword() +
      "@" + mServerName + ":" + mPort + "/" + mOcPrefix + "/" + OCS_SHARE_PATH;
  }

  public <T> T exec(
    HttpRequestBase request,
    ResponseHandler<T> responseHandler
  )
    throws IOException
  {
    return mHttpClient.execute(request, responseHandler);
  }

  private HttpClientBuilder clientBuilder(ProxySelector selector, CredentialsProvider credentials)
  {
    Registry<ConnectionSocketFactory> schemeRegistry = this.createDefaultSchemeRegistry();
    HttpClientConnectionManager cm = this.createDefaultConnectionManager(schemeRegistry);
    String version = "1.0";
    if (version == null)
    {
      version = VersionInfo.UNAVAILABLE;
    }
    return HttpClients.custom()
      .setUserAgent("ZeXtrasOCClient/" + version)
      .setDefaultCredentialsProvider(credentials)
      .setRedirectStrategy(this.createDefaultRedirectStrategy())
      .setDefaultRequestConfig(RequestConfig.custom()
        // Only selectively enable this for PUT but not all entity enclosing methods
        .setExpectContinueEnabled(false).build())
      .setConnectionManager(cm)
      .setRoutePlanner(this.createDefaultRoutePlanner(this.createDefaultSchemePortResolver(), selector));
  }

  private CredentialsProvider getCredentialsProvider(String username, String password, String domain, String workstation)
  {
    CredentialsProvider provider = new BasicCredentialsProvider();
    if (username != null)
    {
      provider.setCredentials(
        new AuthScope(AuthScope.ANY_HOST, AuthScope.ANY_PORT, AuthScope.ANY_REALM, AuthPolicy.NTLM),
        new NTCredentials(username, password, workstation, domain));
      provider.setCredentials(
        new AuthScope(AuthScope.ANY_HOST, AuthScope.ANY_PORT, AuthScope.ANY_REALM, AuthPolicy.BASIC),
        new UsernamePasswordCredentials(username, password));
      provider.setCredentials(
        new AuthScope(AuthScope.ANY_HOST, AuthScope.ANY_PORT, AuthScope.ANY_REALM, AuthPolicy.DIGEST),
        new UsernamePasswordCredentials(username, password));
      provider.setCredentials(
        new AuthScope(AuthScope.ANY_HOST, AuthScope.ANY_PORT, AuthScope.ANY_REALM, AuthPolicy.SPNEGO),
        new UsernamePasswordCredentials(username, password));
      provider.setCredentials(
        new AuthScope(AuthScope.ANY_HOST, AuthScope.ANY_PORT, AuthScope.ANY_REALM, AuthPolicy.KERBEROS),
        new UsernamePasswordCredentials(username, password));
    }
    return provider;
  }

  protected DefaultSchemePortResolver createDefaultSchemePortResolver()
  {
    return new DefaultSchemePortResolver();
  }

  protected SardineRedirectStrategy createDefaultRedirectStrategy()
  {
    return new SardineRedirectStrategy();
  }

  /**
   * Creates a new registry for default ports with socket factories.
   */
  protected Registry<ConnectionSocketFactory> createDefaultSchemeRegistry()
  {
    return RegistryBuilder.<ConnectionSocketFactory>create()
      .register("http", this.createDefaultSocketFactory())
      .register("https", this.createDefaultSecureSocketFactory())
      .build();
  }

  /**
   * @return Default socket factory
   */
  protected ConnectionSocketFactory createDefaultSocketFactory()
  {
    return PlainConnectionSocketFactory.getSocketFactory();
  }

  /**
   * @return Default SSL socket factory
   */
  protected ConnectionSocketFactory createDefaultSecureSocketFactory()
  {
    return SSLConnectionSocketFactory.getSocketFactory();
  }

  /**
   * Use fail fast connection manager when connections are not released properly.
   *
   * @param schemeRegistry Protocol registry
   * @return Default connection manager
   */
  protected HttpClientConnectionManager createDefaultConnectionManager(Registry<ConnectionSocketFactory> schemeRegistry)
  {
    return new PoolingHttpClientConnectionManager(schemeRegistry);
  }

  /**
   * Override to provide proxy configuration
   *
   * @param resolver Protocol registry
   * @param selector Proxy configuration
   * @return ProxySelectorRoutePlanner configured with schemeRegistry and selector
   */
  protected HttpRoutePlanner createDefaultRoutePlanner(SchemePortResolver resolver, ProxySelector selector)
  {
    return new SystemDefaultRoutePlanner(resolver, selector);
  }

}
