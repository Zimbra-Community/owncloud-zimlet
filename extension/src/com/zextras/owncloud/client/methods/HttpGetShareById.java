package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.client.OwnCloudClient;
import org.apache.http.client.methods.HttpGet;

import java.net.URI;
import java.net.URISyntaxException;

public class HttpGetShareById extends HttpGet
{
  /**
   * Get information about a given share.
   * @param client The {@see OwnCloudClient} client
   * @param shareId Share ID
   */
  public HttpGetShareById(OwnCloudClient client, int shareId)
  {
    try
    {
      this.setURI(new URI(client.getOCSSharesUrl() + "/shares/" + shareId));
    } catch (URISyntaxException e)
    {
      throw new RuntimeException(e);
    }
  }
}
