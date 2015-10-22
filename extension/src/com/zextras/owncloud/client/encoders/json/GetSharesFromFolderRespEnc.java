package com.zextras.owncloud.client.encoders.json;


import com.zextras.owncloud.OwnCloudCommand;
import com.zextras.owncloud.client.Share;
import com.zextras.owncloud.client.encoders.ResponseEncoder;
import com.zextras.owncloud.client.encoders.json.utils.ShareEncoder;
import org.json.JSONArray;
import org.openzal.zal.soap.SoapResponse;

import java.util.List;

public class GetSharesFromFolderRespEnc implements ResponseEncoder
{
  private final List<Share> mShares;
  private final SoapResponse mSoapResponse;

  public GetSharesFromFolderRespEnc(SoapResponse soapResponse, List<Share> shares)
  {
    mShares = shares;
    mSoapResponse = soapResponse;
  }

  @Override
  public void encode()
  {
    JSONArray retShares = new JSONArray();
    for (Share share : mShares)
    {
      retShares.put(new ShareEncoder(share).encode());
    }
    mSoapResponse.setValue(OwnCloudCommand.GET_SHARES_FROM_FOLDER.value(), retShares.toString());
  }
}
