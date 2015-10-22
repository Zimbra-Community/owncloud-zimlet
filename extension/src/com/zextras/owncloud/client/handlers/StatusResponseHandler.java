package com.zextras.owncloud.client.handlers;


import com.zextras.owncloud.client.responses.StatusResponse;
import org.apache.http.HttpResponse;
import org.openzal.zal.log.ZimbraLog;

import java.io.IOException;

public class StatusResponseHandler extends ValidatingResponseHandler<StatusResponse>
{
  @Override
  public StatusResponse handleResponse(HttpResponse httpResponse) throws IOException
  {
    StatusResponse statusResponse = validateResponse(httpResponse);
    ZimbraLog.mailbox.debug("#####");
    return statusResponse;

//    InputStream is = entity.getContent();
//    byte[] buffer = new byte[1024];
//    int bytesRead = -1;
//    List<byte[]> buffers = new ArrayList<byte[]>();
//
//    while ((bytesRead = is.read(buffer)) != -1)
//    {
//      byte[] cloned = new byte[bytesRead];
//      for (int i = 0; i < bytesRead; i++)
//      {
//        cloned[i] = buffer[i];
//      }
//      buffers.add(cloned);
//    }
//    StringBuilder sb = new StringBuilder();
//    for (byte[] buff : buffers)
//    {
//      sb.append(new String(buff));
//    }
//
//    ZimbraLog.mailbox.info("#####");
//    ZimbraLog.mailbox.info(sb.toString());
//    ZimbraLog.mailbox.info("#####");
  }

}
