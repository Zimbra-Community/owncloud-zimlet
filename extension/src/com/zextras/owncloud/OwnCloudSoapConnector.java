package com.zextras.owncloud;


import com.zextras.dav.ZimletProperty;
import com.zextras.owncloud.client.OwnCloudClient;
import com.zextras.owncloud.client.Share;
import com.zextras.owncloud.client.encoders.ResponseEncoder;
import com.zextras.owncloud.client.encoders.json.GetAllSharesRespEnc;
import com.zextras.owncloud.client.handlers.SharesResponseHandler;
import com.zextras.owncloud.client.methods.HttpGetAllShares;
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
}
