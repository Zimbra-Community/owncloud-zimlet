package com.zextras.dav;

import org.openzal.zal.extension.ZalExtension;
import org.openzal.zal.extension.ZalExtensionController;
import org.openzal.zal.extension.Zimbra;
import org.openzal.zal.log.ZimbraLog;
import org.openzal.zal.soap.SoapServiceManager;

public class DavExtension implements ZalExtension
{

  private final SoapServiceManager mSoapServiceManager;
  private DavSOAPService mDavSoapService;

  public DavExtension()
  {
    mSoapServiceManager = new SoapServiceManager();
    mDavSoapService = new DavSOAPService();
  }

  @Override
  public String getBuildId()
  {
    return "1";
  }

  @Override
  public String getName()
  {
    return "davSoapConnector";
  }

  @Override
  public void startup(ZalExtensionController zalExtensionController, Zimbra zimbra)
  {
    mSoapServiceManager.register(mDavSoapService);
    ZimbraLog.mailbox.info("Loaded WebDav extension.");
  }

  @Override
  public void shutdown()
  {
    mSoapServiceManager.unregister(mDavSoapService);
    ZimbraLog.mailbox.info("Removed extension ownCloud.");
  }
}
