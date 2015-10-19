package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.client.OwnCloudClient;
import org.apache.http.client.methods.HttpRequestBase;

public class HttpGetAllShares extends HttpRequestBase
{
  public static final String METHOD_NAME = "GET";

  public HttpGetAllShares(OwnCloudClient client)
  {
    this.setURI(client.getOCSSharesUri());
  }

  @Override
  public String getMethod()
  {
    return METHOD_NAME;
  }
}
