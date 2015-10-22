package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.client.OwnCloudClient;
import org.apache.http.client.methods.HttpGet;

import java.net.URI;
import java.net.URISyntaxException;

public class HttpGetAllShares extends HttpGet
{
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
}
