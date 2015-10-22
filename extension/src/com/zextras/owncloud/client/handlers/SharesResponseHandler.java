package com.zextras.owncloud.client.handlers;


import com.zextras.owncloud.client.Share;
import com.zextras.owncloud.client.responses.StatusResponse;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class SharesResponseHandler extends ValidatingResponseHandler<List<Share>>
{
  @Override
  public List<Share> handleResponse(HttpResponse httpResponse) throws IOException
  {
    StatusResponse statusResponse = validateResponse(httpResponse);

    HttpEntity entity = httpResponse.getEntity();

    DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
    DocumentBuilder docBuilder = null;
    try
    {
      docBuilder = docFactory.newDocumentBuilder();
      Document document = docBuilder.parse(entity.getContent());

      NodeList elements = document.getElementsByTagName("element");
      List<Share> shares = new ArrayList<Share>(elements.getLength());
      for (int i = 0; i < elements.getLength(); i++) {
        if (elements.item(i).getNodeType() == Node.ELEMENT_NODE) {
          shares.add(Share.fromElement((Element) elements.item(i)));
        }
      }
      return shares;
    } catch (Exception e)
    {
      throw new RuntimeException(e);
    }
  }

}
