package com.zextras.owncloud.client.handlers;


import com.zextras.owncloud.client.responses.CreateShareResponse;
import com.zextras.owncloud.client.responses.StatusResponse;
import org.apache.http.HttpResponse;
//import org.openzal.zal.log.ZimbraLog;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.io.IOException;
//import java.io.InputStream;
//import java.util.ArrayList;
//import java.util.List;

public class CreateShareResponseHandler extends ValidatingResponseHandler<CreateShareResponse>
{
  @Override
  public CreateShareResponse handleResponse(HttpResponse httpResponse) throws IOException
  {
    StatusResponse statusResponse = validateResponse(httpResponse);
    String shareId = "-1";
    {
      NodeList elements = statusResponse.getDocument().getElementsByTagName("id");
      for (int i = 0; i < elements.getLength(); i++)
      {
        if (elements.item(i).getNodeType() == Node.ELEMENT_NODE)
        {
          shareId = ((Element) elements.item(i)).getTextContent();
        }
      }
    }
    String url = null;
    {
      NodeList elements = statusResponse.getDocument().getElementsByTagName("url");
      for (int i = 0; i < elements.getLength(); i++)
      {
        if (elements.item(i).getNodeType() == Node.ELEMENT_NODE)
        {
          url = ((Element) elements.item(i)).getTextContent();
        }
      }
    }
    String token = null;
    {
      NodeList elements = statusResponse.getDocument().getElementsByTagName("token");
      for (int i = 0; i < elements.getLength(); i++)
      {
        if (elements.item(i).getNodeType() == Node.ELEMENT_NODE)
        {
          token = ((Element) elements.item(i)).getTextContent();
        }
      }
    }

    return new CreateShareResponse(
      statusResponse.getStatus(),
      statusResponse.getStatuscode(),
      statusResponse.getMessage(),
      Integer.parseInt(shareId),
      url,
      token
    );

//    InputStream is = httpResponse.getEntity().getContent();
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
//
//    return null;
  }

}

//<id>10</id>
//<url>https://{server}:{port}/index.php/s/JHrahOpJCkxWT2b</url>
//<token>JHrahOpJCkxWT2b</token>
