package com.zextras.owncloud.client.encoders.json;


import com.zextras.owncloud.OwnCloudCommand;
import com.zextras.owncloud.client.responses.StatusResponse;
import org.json.JSONObject;
import org.openzal.zal.soap.SoapResponse;

public class UpdateShareRespEnc extends StatusRespEnc
{
  private final OwnCloudCommand mCommand;
  private final StatusResponse mResponsePermissions;
  private final StatusResponse mResponsePassword;
  private final StatusResponse mResponsePublicUpload;
  private final StatusResponse mResponseExpireDate;
  private final SoapResponse mSoapResponse;

  public UpdateShareRespEnc(
    SoapResponse soapResponse,
    OwnCloudCommand command,
    StatusResponse responsePermissions,
    StatusResponse responsePassword,
    StatusResponse responsePublicUpload,
    StatusResponse responseExpireDate
  )
  {
    super(soapResponse, command, null);
    mSoapResponse = soapResponse;
    mCommand = command;
    mResponsePermissions = responsePermissions;
    mResponsePassword = responsePassword;
    mResponsePublicUpload = responsePublicUpload;
    mResponseExpireDate = responseExpireDate;
  }

  @Override
  public void encode()
  {
    JSONObject jo = new JSONObject();

    if (mResponsePermissions != null)
      jo.put("permissions", statusResponseToJson(mResponsePermissions));
    if (mResponsePassword != null)
      jo.put("password", statusResponseToJson(mResponsePassword));
    if (mResponsePublicUpload != null)
      jo.put("publicUpload", statusResponseToJson(mResponsePublicUpload));
    if (mResponseExpireDate != null)
      jo.put("expireDate", statusResponseToJson(mResponseExpireDate));

    mSoapResponse.setValue(
      mCommand.value(),
      jo.toString()
    );
  }
}
