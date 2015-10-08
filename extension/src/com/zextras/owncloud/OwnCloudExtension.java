package com.zextras.owncloud;

import org.openzal.zal.extension.ZalExtension;
import org.openzal.zal.extension.ZalExtensionController;
import org.openzal.zal.extension.Zimbra;
import org.openzal.zal.log.ZimbraLog;
import org.openzal.zal.soap.SoapServiceManager;

public class OwnCloudExtension implements ZalExtension
{

  private final SoapServiceManager mSoapServiceManager;
  private OwnCloudSOAPService mOwnCloudSoapService;

  public OwnCloudExtension()
  {
    mSoapServiceManager = new SoapServiceManager();
    mOwnCloudSoapService = new OwnCloudSOAPService();
  }

  @Override
  public String getBuildId()
  {
    return "1";
  }

  @Override
  public String getName()
  {
    return "ownCloud";
  }

  @Override
  public void startup(ZalExtensionController zalExtensionController, Zimbra zimbra)
  {
    mSoapServiceManager.register(mOwnCloudSoapService);
    ZimbraLog.mailbox.info("Loaded extension ownCloud.");
  }

  @Override
  public void shutdown()
  {
    mSoapServiceManager.unregister(mOwnCloudSoapService);
    ZimbraLog.mailbox.info("Removed extension ownCloud.");
  }
}
