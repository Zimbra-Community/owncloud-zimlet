package com.zextras.owncloud.client.handlers;


import org.apache.http.HttpResponse;
import java.io.IOException;

public class VoidResponseHandler extends ValidatingResponseHandler<Void>
{
  @Override
  public Void handleResponse(HttpResponse httpResponse) throws IOException
  {
    validateResponse(httpResponse);
    return null;
  }

}
