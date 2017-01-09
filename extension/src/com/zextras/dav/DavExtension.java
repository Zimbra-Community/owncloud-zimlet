package com.zextras.dav;

import org.openzal.zal.extension.ZalExtension;
import org.openzal.zal.extension.ZalExtensionController;
import org.openzal.zal.extension.Zimbra;
import org.openzal.zal.http.HttpServiceManager;
import org.openzal.zal.log.ZimbraLog;
import org.openzal.zal.soap.SoapServiceManager;

import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.Map;

/**
 * ZAL Extension created to operate on a DAV server using the SOAP interface.
 * The core of the ZAL will take care to handle this extension.
 */
public class DavExtension implements ZalExtension
{
  private final HttpServiceManager mHttpServiceManager;
  private final SoapServiceManager mSoapServiceManager;
  private final DavSOAPService mDavSoapService;
  private final Zimbra mZimbra;
  private final DownloadHandler mDownloadHandler;
  private final UploadHandler mUploadHandler;

  private Map<String, DownloadJob> mDownloadJobMap;

  public DavExtension()
  {
    mDownloadJobMap = new HashMap<String, DownloadJob>();

    mZimbra = new Zimbra();
    mHttpServiceManager = new HttpServiceManager();
    mSoapServiceManager = new SoapServiceManager();
    mDavSoapService = new DavSOAPService(mZimbra.getProvisioning(), mDownloadJobMap);
    mDownloadHandler = new DownloadHandler(mDownloadJobMap);
    mUploadHandler = new UploadHandler(mZimbra.getProvisioning());
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
   * @param weakReference The Zimbra class loader reference.
   */
  @Override
  public void startup(ZalExtensionController zalExtensionController, WeakReference<ClassLoader> weakReference)
  {
    mSoapServiceManager.register(mDavSoapService);
    mHttpServiceManager.registerHandler(mDownloadHandler);
    mHttpServiceManager.registerHandler(mUploadHandler);
    ZimbraLog.mailbox.info("Loaded WebDav extension.");
  }

  /**
   * Method called by the ZAL Core to do the shutdown if the extension.
   */
  @Override
  public void shutdown()
  {
    mSoapServiceManager.unregister(mDavSoapService);
    mHttpServiceManager.unregisterHandler(mDownloadHandler);
    mHttpServiceManager.unregisterHandler(mUploadHandler);
    ZimbraLog.mailbox.info("Removed extension ownCloud.");
  }
}
