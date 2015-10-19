package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.client.OwnCloudClient;
import org.apache.http.client.methods.HttpRequestBase;

import java.net.URI;
import java.net.URISyntaxException;

public class HttpGetSharesFromFolder extends HttpRequestBase
{
  public static final String METHOD_NAME = "GET";

  /**
   * Get all shares from a given file/folder.
   * @param client The {@see OwnCloudClient} client
   * @param path Path to file/folder
   * @param reshares Returns not only the shares from the current user but all shares from the given file.
   * @param subfiles Returns all shares within a folder, given that path defines a folder.
   */
  public HttpGetSharesFromFolder(
    OwnCloudClient client,
    String path,
    boolean reshares,
    boolean subfiles
  )
  {
    try
    {
      String enableReshares = reshares ? "true" : "false";
      String enableSubfiles = subfiles ? "true" : "false";

      this.setURI(
        new URI(
          client.getOCSSharesUrl() +
            "/shares?path=" + path +
            "&reshares=" + enableReshares +
            "&subfiles=" + enableSubfiles
        ));
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
