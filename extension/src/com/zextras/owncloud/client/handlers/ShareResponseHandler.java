package com.zextras.owncloud.client.handlers;


import com.zextras.owncloud.client.Share;
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

public class ShareResponseHandler extends ValidatingResponseHandler<Share>
{
  @Override
  public Share handleResponse(HttpResponse httpResponse) throws IOException
  {
    validateResponse(httpResponse);

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
      if (shares.size() < 1)
      {
        throw new RuntimeException("Share with given ID does not exists.");
      }
      return shares.get(0);
    } catch (Exception e)
    {
      throw new RuntimeException(e);
    }
// <?xml version="1.0"?>
// <ocs>
//   <meta>
//     <status>ok</status>
//     <statuscode>100</statuscode>
//     <message/>
//   </meta>
//   <data>
//     <element>
//       <id>20</id>
//       <item_type>file</item_type>
//       <item_source>13539</item_source>
//       <parent/>
//       <share_type>3</share_type>
//       <share_with/>
//       <file_source>13539</file_source>
//       <file_target>/EXAMPLE2.txt</file_target>
//       <path>/EXAMPLE2.txt</path>
//       <permissions>1</permissions>
//       <stime>1444991594</stime>
//       <expiration/>
//       <token>4qdeq0LYVAyCLhS</token>
//       <storage>10</storage>
//       <mail_send>0</mail_send>
//       <uid_owner>zimbra</uid_owner>
//       <storage_id>home::zimbra</storage_id>
//       <file_parent>13487</file_parent>
//       <share_with_displayname/>
//       <displayname_owner>zimbra</displayname_owner>
//       <mimetype>text/plain</mimetype>
//       <isPreviewAvailable>1</isPreviewAvailable>
//       <icon>/core/img/filetypes/text.svg</icon>
//     </element>
//     <element>
//       <id>21</id>
//       <item_type>file</item_type>
//       <item_source>13488</item_source>
//       <parent/>
//       <share_type>3</share_type>
//       <share_with/>
//       <file_source>13488</file_source>
//       <file_target>/ownCloudUserManual.pdf</file_target>
//       <path>/ownCloudUserManual.pdf</path>
//       <permissions>1</permissions>
//       <stime>1444991598</stime>
//       <expiration/>
//       <token>SAECduHdBydp0PX</token>
//       <storage>10</storage>
//       <mail_send>0</mail_send>
//       <uid_owner>zimbra</uid_owner>
//       <storage_id>home::zimbra</storage_id>
//       <file_parent>13487</file_parent>
//       <share_with_displayname/>
//       <displayname_owner>zimbra</displayname_owner>
//       <mimetype>application/pdf</mimetype>
//       <icon>/core/img/filetypes/application-pdf.svg</icon>
//     </element>
//   </data>
// </ocs>
  }

}
