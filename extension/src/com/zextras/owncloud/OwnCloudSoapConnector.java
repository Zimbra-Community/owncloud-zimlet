package com.zextras.owncloud;


import com.zextras.Zimlet;
import com.zextras.dav.ZimletProperty;
import com.zextras.owncloud.client.OwnCloudClient;
import com.zextras.owncloud.client.Share;
import com.zextras.owncloud.client.ShareType;
import com.zextras.owncloud.client.handlers.CreateShareResponseHandler;
import com.zextras.owncloud.client.responses.CreateShareResponse;
import com.zextras.owncloud.client.responses.StatusResponse;
import com.zextras.owncloud.client.encoders.ResponseEncoder;
import com.zextras.owncloud.client.encoders.json.*;
import com.zextras.owncloud.client.handlers.ShareResponseHandler;
import com.zextras.owncloud.client.handlers.SharesResponseHandler;
import com.zextras.owncloud.client.handlers.StatusResponseHandler;
import com.zextras.owncloud.client.methods.*;
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
  private final OwnCloudClient mOwnCloudClient;

  public OwnCloudSoapConnector(Account account)
  {
    final Map<String, String> userProperties = UserPropertyExtractor.getZimletUserProperties(account, Zimlet.NAME);
    if (
        userProperties.get(ZimletProperty.DAV_SERVER_NAME) == null ||
        userProperties.get(ZimletProperty.DAV_SERVER_PORT) == null ||
        userProperties.get(ZimletProperty.DAV_SERVER_PATH) == null ||
        userProperties.get(ZimletProperty.DAV_USER_USERNAME) == null
      )
    {
      throw new RuntimeException("DAV Data connection not set for user '" + account.getName() + "'");
    }

    final URL url;
    final int port = Integer.parseInt(userProperties.get(ZimletProperty.DAV_SERVER_PORT));
    try
    {
      url = new URL(userProperties.get(ZimletProperty.DAV_SERVER_NAME) + ":" + port);
    } catch (MalformedURLException e)
    {
      throw new RuntimeException(e);
    }

    mOwnCloudClient = new OwnCloudClient(
      url.getProtocol(),
      url.getHost(),
      port,
      userProperties.get(ZimletProperty.OC_PATH),
      userProperties.get(ZimletProperty.DAV_USER_USERNAME),
      zimbraContext.getParameter(dav_user_password, "")
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
    ResponseEncoder responseEncoder = new GetAllSharesRespEnc(soapResponse, shares);
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
  )
    throws IOException
  {
    List<Share> shares = mOwnCloudClient.exec(
      new HttpGetSharesFromFolder(mOwnCloudClient, path, reshares, subfiles),
      new SharesResponseHandler()
    );
    ResponseEncoder responseEncoder = new GetSharesFromFolderRespEnc(soapResponse, shares);
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
    ResponseEncoder responseEncoder = new GetShareByIdRespEnc(soapResponse, share);
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
    StatusResponse response = mOwnCloudClient.exec(
      new HttpDeleteShareById(mOwnCloudClient, shareId),
      new StatusResponseHandler()
    );
    StatusRespEnc responseEncoder = new StatusRespEnc(soapResponse, OwnCloudCommand.DELETE_SHARE_BY_ID, response);
    responseEncoder.encode();
  }

  public void updateShare(
    SoapResponse soapResponse,
    int shareId,
    /* @Nullable */ String permissions,
    /* @Nullable */ String password,
    /* @Nullable */ String publicUpload,
    /* @Nullable */ String expireDate
  )
    throws IOException
  {
    StatusResponse statusPermissions = null;
    StatusResponse statusPassword = null;
    StatusResponse statusPublicUpload = null;
    StatusResponse statusExpireDate = null;
    if (permissions != null)
    {
      statusPermissions = mOwnCloudClient.exec(
        new HttpUpdateShare(mOwnCloudClient, shareId, "permissions", Integer.parseInt(permissions, 10)),
        new StatusResponseHandler()
      );
    }
    if (password != null)
    {
      statusPassword = mOwnCloudClient.exec(
        new HttpUpdateShare(mOwnCloudClient, shareId, "password", password),
        new StatusResponseHandler()
      );
    }
    if (publicUpload != null)
    {
      statusPublicUpload = mOwnCloudClient.exec(
        new HttpUpdateShare(mOwnCloudClient, shareId, "publicUpload", Boolean.parseBoolean(publicUpload)),
        new StatusResponseHandler()
      );
    }
    if (expireDate != null)
    {
      statusExpireDate = mOwnCloudClient.exec(
        new HttpUpdateShare(mOwnCloudClient, shareId, "expireDate", expireDate),
        new StatusResponseHandler()
      );
    }

    StatusRespEnc responseEncoder = new UpdateShareRespEnc(
      soapResponse,
      OwnCloudCommand.UPDATE_SHARE,
      statusPermissions,
      statusPassword,
      statusPublicUpload,
      statusExpireDate
    );
    responseEncoder.encode();
  }

  public void createShare(
    SoapResponse soapResponse,
    String path,
    ShareType shareType,
    String shareWith,
    boolean publicUpload,
    String password,
    Permission permissions
  )
    throws IOException
  {
    CreateShareResponse response = mOwnCloudClient.exec(
      new HttpCreateShare(
        mOwnCloudClient,
        path,
        shareType,
        shareWith,
        publicUpload,
        password,
        permissions
      ),
      new CreateShareResponseHandler()
    );
    CreateShareRespEnc responseEncoder = new CreateShareRespEnc(
      soapResponse,
      response
    );
    responseEncoder.encode();
  }
}
