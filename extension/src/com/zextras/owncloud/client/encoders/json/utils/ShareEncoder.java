package com.zextras.owncloud.client.encoders.json.utils;

import com.zextras.owncloud.client.Share;
import org.json.JSONObject;

public class ShareEncoder implements JsonObjectEncoder
{
  private final Share mShare;

  public ShareEncoder(Share share)
  {

    mShare = share;
  }

  @Override
  public JSONObject encode()
  {
    JSONObject shareObj = new JSONObject();
    shareObj.put("id", mShare.getId());
    shareObj.put("itemType", mShare.getItemType());
    shareObj.put("itemSource", mShare.getItemSource());
    shareObj.put("parent", mShare.getParent());
    shareObj.put("shareType", mShare.getShareType());
    shareObj.put("shareWith", mShare.getShareWith());
    shareObj.put("fileSource", mShare.getFileSource());
    shareObj.put("fileTarget", mShare.getFileTarget());
    shareObj.put("path", mShare.getPath());
    shareObj.put("permissions", mShare.getPermissions());
    shareObj.put("sTime", (mShare.getSTime() != null) ? mShare.getSTime().getTime() : null);
    shareObj.put("expiration", (mShare.getExpiration() != null) ? mShare.getExpiration().getTime() : null);
    shareObj.put("token", mShare.getToken());
    shareObj.put("storage", mShare.getStorage());
    shareObj.put("mailSend", mShare.getMailSend());
    shareObj.put("uidOwner", mShare.getUidOwner());
    shareObj.put("storageId", mShare.getStorageId());
    shareObj.put("fileParent", mShare.getFileParent());
    shareObj.put("shareWithDisplayname", mShare.getShareWithDisplayname());
    shareObj.put("displaynameOwner", mShare.getDisplaynameOwner());
    shareObj.put("mimeType", mShare.getMimeType());
    shareObj.put("isPreviewAvailable", mShare.isPreviewAvailable());
    shareObj.put("icon", mShare.getIcon());
    return shareObj;
  }
}
