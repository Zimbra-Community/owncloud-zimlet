package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.client.OwnCloudClient;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.message.BasicNameValuePair;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

public class HttpUpdateShare extends HttpPut
{
  /**
   * Update a given share. Only one value can be updated per request.
   * @param ownCloudClient The {@see OwnCloudClient} client
   * @param shareId The share id
   */
  private HttpUpdateShare(OwnCloudClient ownCloudClient, int shareId)
  {
    try
    {
      setURI(
        new URI(
          ownCloudClient.getOCSSharesUrl() + "/shares/" + shareId
        )
      );
    } catch (URISyntaxException e)
    {
      throw new RuntimeException(e);
    }
  }

  /**
   * Update a given share. Only one value can be updated per request.
   * @param ownCloudClient The {@see OwnCloudClient} client
   * @param shareId The share id
   * @param key The share config key to be updated
   * @param value The updated value
   */
  public HttpUpdateShare(OwnCloudClient ownCloudClient, int shareId, String key, int value)
  {
    this(ownCloudClient, shareId, key, "" + value);
  }

  /**
   * Update a given share. Only one value can be updated per request.
   * @param ownCloudClient The {@see OwnCloudClient} client
   * @param shareId The share id
   * @param key The share config key to be updated
   * @param value The updated value
   */
  public HttpUpdateShare(OwnCloudClient ownCloudClient, int shareId, String key, boolean value)
  {
    this(ownCloudClient, shareId, key, value ? "true" : "false");
  }

  /**
   * Update a given share. Only one value can be updated per request.
   * @param ownCloudClient The {@see OwnCloudClient} client
   * @param shareId The share id
   * @param key The share config key to be updated
   * @param value The updated value
   */
  public HttpUpdateShare(OwnCloudClient ownCloudClient, int shareId, String key, String value)
  {
    this(ownCloudClient, shareId);
    try
    {
      List<NameValuePair> nameValuePairs = new ArrayList<NameValuePair>(1);
      nameValuePairs.add(new BasicNameValuePair(key, value));
      setEntity(new UrlEncodedFormEntity(nameValuePairs));
    } catch (UnsupportedEncodingException e)
    {
      throw new RuntimeException(e);
    }
  }
}
