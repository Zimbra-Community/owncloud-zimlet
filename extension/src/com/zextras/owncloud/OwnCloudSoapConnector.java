package com.zextras.owncloud;


import com.zextras.dav.ZimletProperty;
import com.zextras.owncloud.client.OwnCloudClient;
import com.zextras.owncloud.client.Share;
import com.zextras.owncloud.client.encoders.ResponseEncoder;
import com.zextras.owncloud.client.encoders.json.VoidResponseEnc;
import com.zextras.owncloud.client.encoders.json.GetAllSharesRespEnc;
import com.zextras.owncloud.client.encoders.json.GetShareByIdRespEnc;
import com.zextras.owncloud.client.encoders.json.GetSharesFromFolderRespEnc;
import com.zextras.owncloud.client.handlers.ShareResponseHandler;
import com.zextras.owncloud.client.handlers.SharesResponseHandler;
import com.zextras.owncloud.client.handlers.VoidResponseHandler;
import com.zextras.owncloud.client.methods.HttpDeleteShareById;
import com.zextras.owncloud.client.methods.HttpGetAllShares;
import com.zextras.owncloud.client.methods.HttpGetShareById;
import com.zextras.owncloud.client.methods.HttpGetSharesFromFolder;
import com.zextras.util.UserPropertyExtractor;
import org.openzal.zal.Account;
import org.openzal.zal.soap.SoapResponse;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;
import java.util.Map;

public class OwnCloudSoapConnector
{
  private static String ZIMLET_NAME = "tk_barrydegraaff_owncloud_zimlet";

  private final OwnCloudClient mOwnCloudClient;

  public OwnCloudSoapConnector(Account account)
  {
    final Map<String, String> userProperties = UserPropertyExtractor.getZimletUserProperties(account, ZIMLET_NAME);
    if (
        userProperties.get(ZimletProperty.DAV_SERVER_NAME) == null ||
        userProperties.get(ZimletProperty.DAV_SERVER_PORT) == null ||
        userProperties.get(ZimletProperty.DAV_SERVER_PATH) == null ||
        userProperties.get(ZimletProperty.DAV_USER_USERNAME) == null ||
        userProperties.get(ZimletProperty.DAV_USER_PASSWORD) == null
      )
    {
      throw new RuntimeException("DAV Data connection not set for user '" + account.getName() + "'");
    }

    final URL url;
    try
    {
      url = new URL(userProperties.get(ZimletProperty.DAV_SERVER_NAME));
    } catch (MalformedURLException e)
    {
      throw new RuntimeException(e);
    }

    mOwnCloudClient = new OwnCloudClient(
      url.getProtocol(),
      url.getHost(),
      Integer.parseInt(userProperties.get(ZimletProperty.DAV_SERVER_PORT)),
      userProperties.get(ZimletProperty.DAV_USER_USERNAME),
      userProperties.get(ZimletProperty.DAV_USER_PASSWORD)
    );
  }

  /**
   * Get all the shares from the user.
   * @param soapResponse The response where the result will be put.
   * @throws IOException
   */
  public void getAllShares(SoapResponse soapResponse)
    throws IOException
  {
    List<Share> shares = mOwnCloudClient.exec(
      new HttpGetAllShares(mOwnCloudClient),
      new SharesResponseHandler()
    );
    ResponseEncoder responseEncoder = new GetAllSharesRespEnc(shares, soapResponse);
    responseEncoder.encode();
  }

  /**
   * Get all shares from a given file/folder.
   * @param soapResponse The response where the result will be put.
   * @param path Path to file/folder
   * @param reshares Returns not only the shares from the current user but all shares from the given file.
   * @param subfiles Returns all shares within a folder, given that path defines a folder.
   * @throws IOException
   */
  public void getSharesFromFolder(
    SoapResponse soapResponse,
    String path,
    boolean reshares,
    boolean subfiles
  ) throws IOException
  {
    List<Share> shares = mOwnCloudClient.exec(
      new HttpGetSharesFromFolder(mOwnCloudClient, path, reshares, subfiles),
      new SharesResponseHandler()
    );
    ResponseEncoder responseEncoder = new GetSharesFromFolderRespEnc(shares, soapResponse);
    responseEncoder.encode();
  }

  /**
   * Get information about a given share.
   * @param soapResponse The response where the result will be put.
   * @param shareId Share ID
   * @throws IOException
   */
  public void getShareById(SoapResponse soapResponse, int shareId)
    throws IOException
  {
    Share share = mOwnCloudClient.exec(
      new HttpGetShareById(mOwnCloudClient, shareId),
      new ShareResponseHandler()
    );
    ResponseEncoder responseEncoder = new GetShareByIdRespEnc(share, soapResponse);
    responseEncoder.encode();
  }

  /**
   * Remove the given share.
   * @param soapResponse The response where the result will be put.
   * @param shareId Share ID
   * @throws IOException
   */
  public void deleteShareById(SoapResponse soapResponse, int shareId)
    throws IOException
  {
    mOwnCloudClient.exec(
      new HttpDeleteShareById(mOwnCloudClient, shareId),
      new VoidResponseHandler()
    );
    VoidResponseEnc responseEncoder = new VoidResponseEnc(OwnCloudCommand.DELETE_SHARE_BY_ID, soapResponse);
    responseEncoder.encode();
  }
}
