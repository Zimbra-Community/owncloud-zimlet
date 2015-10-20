package com.zextras.owncloud.client.encoders.json;


import com.zextras.owncloud.OwnCloudCommand;
import com.zextras.owncloud.client.encoders.ResponseEncoder;
import org.openzal.zal.soap.SoapResponse;


public class VoidResponseEnc implements ResponseEncoder
{
  private final OwnCloudCommand mCommand;
  private final SoapResponse mSoapResponse;

  public VoidResponseEnc(OwnCloudCommand command, SoapResponse soapResponse)
  {
    mCommand = command;
    mSoapResponse = soapResponse;
  }

  @Override
  public void encode()
  {
    mSoapResponse.setValue(mCommand.value(), true);
  }
}
