package com.zextras.dav;

import org.openzal.zal.extension.ZalExtension;
import org.openzal.zal.extension.ZalExtensionController;
import org.openzal.zal.extension.Zimbra;
import org.openzal.zal.log.ZimbraLog;
import org.openzal.zal.soap.SoapServiceManager;

/**
 * ZAL Extension created to operate on a DAV server using the SOAP interface.
 * The core of the ZAL will take care to handle this extension.
 */
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

  /**
   * Method called by the ZAL Core to do the startup if the extension.
   * @param zalExtensionController The ZAL Controller instance.
   * @param zimbra The Zimbra context.
   */
  @Override
  public void startup(ZalExtensionController zalExtensionController, Zimbra zimbra)
  {
    mSoapServiceManager.register(mDavSoapService);
    ZimbraLog.mailbox.info("Loaded WebDav extension.");
  }

  /**
   * Method called by the ZAL Core to do the shutdown if the extension.
   */
  @Override
  public void shutdown()
  {
    mSoapServiceManager.unregister(mDavSoapService);
    ZimbraLog.mailbox.info("Removed extension ownCloud.");
  }
}
