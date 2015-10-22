package com.zextras.owncloud.client.methods;


import com.zextras.owncloud.Permission;
import com.zextras.owncloud.client.OwnCloudClient;
import com.zextras.owncloud.client.ShareType;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.message.BasicNameValuePair;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

public class HttpCreateShare extends HttpPost
{
  /**
   * Share a new file/folder with a user/group or as a public link.
   * @param ownCloudClient The {@see OwnCloudClient} client
   * @param path Path to the file/folder which should be shared.
   * @param shareType 0 = user; 1 = group; 3 = public link; 6 = federated cloud share
   * @param shareWith User/Group id with which the file should be shared.
   * @param publicUpload Allow public upload to a public shared folder.
   * @param password Password to protect public link Share with.
   * @param permissions 1 = read; 2 = update; 4 = create; 8 = delete; 16 = share; 31 = all (default: 31, for public shares: 1)
   */
  public HttpCreateShare(
    OwnCloudClient ownCloudClient,
    String path,
    ShareType shareType,
    String shareWith,
    boolean publicUpload,
    String password,
    Permission permissions
  )
  {
    try
    {
      setURI(
        new URI(
          ownCloudClient.getOCSSharesUrl() + "/shares"
        )
      );
      List<NameValuePair> nameValuePairs = new ArrayList<NameValuePair>(1);
      nameValuePairs.add(new BasicNameValuePair("path", path));
      nameValuePairs.add(new BasicNameValuePair("shareType", "" + shareType.getCode()));
      if (shareWith != null) nameValuePairs.add(new BasicNameValuePair("shareWith", shareWith));
      nameValuePairs.add(new BasicNameValuePair("publicUpload", publicUpload ? "true" : "false"));
      if (password != null) nameValuePairs.add(new BasicNameValuePair("password", password));
      nameValuePairs.add(new BasicNameValuePair("permissions", "" + permissions.getCode()));
      setEntity(new UrlEncodedFormEntity(nameValuePairs));
    } catch (URISyntaxException e)
    {
      throw new RuntimeException(e);
    } catch (UnsupportedEncodingException e)
    {
      throw new RuntimeException(e);
    }

  }
}
