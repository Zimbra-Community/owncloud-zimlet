package com.zextras.owncloud;

import org.openzal.zal.extension.ZalExtension;
import org.openzal.zal.extension.ZalExtensionController;
import org.openzal.zal.extension.Zimbra;
import org.openzal.zal.log.ZimbraLog;

public class OwnCloudExtension implements ZalExtension
{

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
    ZimbraLog.mailbox.info("Loaded extension ownCloud.");
  }

  @Override
  public void shutdown()
  {
    ZimbraLog.mailbox.info("Removed extension ownCloud.");
  }
}
