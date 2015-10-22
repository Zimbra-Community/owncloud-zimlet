package com.zextras.owncloud.client.encoders.json;


import com.zextras.owncloud.OwnCloudCommand;
import com.zextras.owncloud.client.encoders.ResponseEncoder;
import com.zextras.owncloud.client.responses.CreateShareResponse;
import org.json.JSONObject;
import org.openzal.zal.soap.SoapResponse;

public class CreateShareRespEnc implements ResponseEncoder
{
  private final SoapResponse mSoapResponse;
  private final CreateShareResponse mResponse;

  public CreateShareRespEnc(
    SoapResponse soapResponse,
    CreateShareResponse response
  )
  {
    mSoapResponse = soapResponse;
    mResponse = response;
  }

  @Override
  public void encode()
  {
    JSONObject jo = new JSONObject();

    jo.put("status", mResponse.getStatus());
    jo.put("statuscode", mResponse.getStatuscode());
    jo.put("message", mResponse.getMessage());
    jo.put("id", mResponse.getShareId());
    jo.put("url", mResponse.getUrl());
    jo.put("token", mResponse.getToken());

    mSoapResponse.setValue(
      OwnCloudCommand.CREATE_SHARE.value(),
      jo.toString()
    );
  }
}
