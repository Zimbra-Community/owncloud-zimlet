package com.zextras.owncloud.client.handlers;


import com.zextras.owncloud.client.responses.StatusResponse;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.StatusLine;
import org.apache.http.client.ResponseHandler;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

/**
 * Basic response handler which takes an url for documentation.
 *
 * @param <T> return type of {@link ResponseHandler#handleResponse(HttpResponse)}.
 * @author mirko
 */
public abstract class ValidatingResponseHandler<T> implements ResponseHandler<T>
{
  /**
   * Checks the response for a statuscode between {@link HttpStatus#SC_OK} and {@link HttpStatus#SC_MULTIPLE_CHOICES}
   * and throws an {@link com.github.sardine.impl.SardineException} otherwise.
   *
   * @param response to check
   */
  protected StatusResponse validateResponse(HttpResponse response)
  {
    StatusLine statusLine = response.getStatusLine();
    int statusCode = statusLine.getStatusCode();
    if (!(statusCode >= HttpStatus.SC_OK && statusCode < HttpStatus.SC_MULTIPLE_CHOICES))
    {
      throw new RuntimeException("Unexpected response '" + statusLine.getStatusCode() + "'");
    }

    HttpEntity entity = response.getEntity();

    DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
    DocumentBuilder docBuilder = null;
    try
    {
      docBuilder = docFactory.newDocumentBuilder();
      Document document = docBuilder.parse(entity.getContent());

      String status = null;
      {
        NodeList elements = document.getElementsByTagName("status");
        for (int i = 0; i < elements.getLength(); i++)
        {
          if (elements.item(i).getNodeType() == Node.ELEMENT_NODE)
          {
            status = ((Element) elements.item(i)).getTextContent();
          }
        }
      }

      {
        NodeList elements = document.getElementsByTagName("statuscode");
        for (int i = 0; i < elements.getLength(); i++)
        {
          if (elements.item(i).getNodeType() == Node.ELEMENT_NODE)
          {
            statusCode = Integer.parseInt(((Element) elements.item(i)).getTextContent());
          }
        }
      }

      String message = null;
      {
        NodeList elements = document.getElementsByTagName("message");
        for (int i = 0; i < elements.getLength(); i++)
        {
          if (elements.item(i).getNodeType() == Node.ELEMENT_NODE)
          {
            message = ((Element) elements.item(i)).getTextContent();
          }
        }
      }

      StatusResponse statusResponse = new StatusResponse(
        status,
        statusCode,
        message
      );
      statusResponse.attachDocument(document);
      return statusResponse;
    } catch (Exception e)
    {
      throw new RuntimeException(e);
    }
  }
}
