package com.zextras.owncloud.client.encoders.json;


import com.zextras.owncloud.OwnCloudCommand;
import com.zextras.owncloud.client.Share;
import com.zextras.owncloud.client.encoders.ResponseEncoder;
import com.zextras.owncloud.client.encoders.json.utils.ShareEncoder;
import org.openzal.zal.soap.SoapResponse;

public class GetShareByIdRespEnc implements ResponseEncoder
{
  private final Share mShare;
  private final SoapResponse mSoapResponse;

  public GetShareByIdRespEnc(Share share, SoapResponse soapResponse)
  {
    mShare = share;

    mSoapResponse = soapResponse;
  }

  @Override
  public void encode()
  {
    mSoapResponse.setValue(OwnCloudCommand.GET_SHARE_BY_ID.value(), new ShareEncoder(mShare).encode().toString());
  }
}
