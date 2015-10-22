package com.zextras.owncloud.client.encoders.json;


import com.zextras.owncloud.OwnCloudCommand;
import com.zextras.owncloud.client.responses.StatusResponse;
import com.zextras.owncloud.client.encoders.ResponseEncoder;
import org.json.JSONObject;
import org.openzal.zal.soap.SoapResponse;

public class StatusRespEnc implements ResponseEncoder
{
  private final OwnCloudCommand mCommand;
  private final StatusResponse mStatusResponse;
  private final SoapResponse mSoapResponse;

  public StatusRespEnc(SoapResponse soapResponse, OwnCloudCommand command, StatusResponse statusResponse)
  {
    mCommand = command;
    mStatusResponse = statusResponse;
    mSoapResponse = soapResponse;
  }

  @Override
  public void encode()
  {

    mSoapResponse.setValue(
      mCommand.value(),
      statusResponseToJson(mStatusResponse).toString()
    );
  }

  protected static JSONObject statusResponseToJson(StatusResponse statusResponse)
  {
    JSONObject resp = new JSONObject();
    if (statusResponse != null)
    {
      resp.put("status", statusResponse.getStatus());
      resp.put("statuscode", statusResponse.getStatuscode());
      resp.put("message", statusResponse.getMessage());
    }
    return resp;
  }
}
