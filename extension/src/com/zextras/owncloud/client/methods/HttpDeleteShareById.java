package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.client.OwnCloudClient;
import org.apache.http.client.methods.HttpRequestBase;

import java.net.URI;
import java.net.URISyntaxException;

public class HttpDeleteShareById extends HttpRequestBase
{
  public static final String METHOD_NAME = "DELETE";

  /**
   * Get information about a given share.
   * @param client The {@see OwnCloudClient} client
   * @param shareId Share ID
   */
  public HttpDeleteShareById(OwnCloudClient client, int shareId)
  {
    try
    {
      this.setURI(new URI(client.getOCSSharesUrl() + "/shares/" + shareId));
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
