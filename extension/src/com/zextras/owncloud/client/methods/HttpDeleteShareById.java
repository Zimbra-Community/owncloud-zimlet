package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.client.OwnCloudClient;
import org.apache.http.client.methods.HttpDelete;

import java.net.URI;
import java.net.URISyntaxException;

public class HttpDeleteShareById extends HttpDelete
{
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
}
