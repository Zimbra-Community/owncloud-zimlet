package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.client.OwnCloudClient;
import org.apache.http.client.methods.HttpRequestBase;

import java.net.URI;
import java.net.URISyntaxException;

public class HttpGetAllShares extends HttpRequestBase
{
  public static final String METHOD_NAME = "GET";

  /**
   * Get all the shares from the user.
   * @param client The {@see OwnCloudClient} client
   */
  public HttpGetAllShares(OwnCloudClient client)
  {
    try
    {
      this.setURI(new URI(client.getOCSSharesUrl() + "/shares"));
    } catch (URISyntaxException e)
    {
      throw new RuntimeException(e);
    }
  }

  @Override
  public String getMethod()
  {
    return METHOD_NAME;
  }
}
