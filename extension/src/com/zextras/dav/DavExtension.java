package com.zextras.dav;

import com.zextras.dav4zimbra.Dav4ZimbraSOAPService;
import com.zextras.owncloud.OwnCloudSOAPService;
import com.zextras.owncloud.proxy.OwnCloudProxyHandler;
import org.openzal.zal.extension.ZalExtension;
import org.openzal.zal.extension.ZalExtensionController;
import org.openzal.zal.extension.Zimbra;
import org.openzal.zal.http.HttpServiceManager;
import org.openzal.zal.log.ZimbraLog;
import org.openzal.zal.soap.SoapServiceManager;

/**
 * ZAL Extension created to operate on a DAV server using the SOAP interface.
 * The core of the ZAL will take care to handle this extension.
 */
public class DavExtension implements ZalExtension
{
  private final SoapServiceManager mSoapServiceManager;
  private final HttpServiceManager mHttpServiceManager;
  private final DavSOAPService mDavSoapService;
  private final Dav4ZimbraSOAPService mDav4ZimbraSoapService;
  private final OwnCloudSOAPService mOwnCloudSoapService;
  private final OwnCloudProxyHandler mOwnCloudProxyHandler;

  public DavExtension()
  {
    mSoapServiceManager = new SoapServiceManager();
    mHttpServiceManager = new HttpServiceManager();
    mDavSoapService = new DavSOAPService();
    mDav4ZimbraSoapService = new Dav4ZimbraSOAPService();
    mOwnCloudSoapService = new OwnCloudSOAPService();
    mOwnCloudProxyHandler = new OwnCloudProxyHandler();
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
    mSoapServiceManager.register(mDav4ZimbraSoapService);
    mSoapServiceManager.register(mOwnCloudSoapService);
    mHttpServiceManager.registerHandler(mOwnCloudProxyHandler);
    ZimbraLog.mailbox.info("Loaded WebDav extension.");
  }

  /**
   * Method called by the ZAL Core to do the shutdown if the extension.
   */
  @Override
  public void shutdown()
  {
    mSoapServiceManager.unregister(mDavSoapService);
    mSoapServiceManager.unregister(mDav4ZimbraSoapService);
    mSoapServiceManager.unregister(mOwnCloudSoapService);
    mHttpServiceManager.unregisterHandler(mOwnCloudProxyHandler);
    ZimbraLog.mailbox.info("Removed extension ownCloud.");
  }
}
