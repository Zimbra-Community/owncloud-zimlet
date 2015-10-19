package com.zextras.owncloud.client;

import org.w3c.dom.Element;

import java.util.Date;

// <element>
//    <id>20</id>
//    <item_type>file</item_type>
//    <item_source>13539</item_source>
//    <parent/>
//    <share_type>3</share_type>
//    <share_with/>
//    <file_source>13539</file_source>
//    <file_target>/EXAMPLE2.txt</file_target>
//    <path>/EXAMPLE2.txt</path>
//    <permissions>1</permissions>
//    <stime>1444991594</stime>
//    <expiration/>
//    <token>4qdeq0LYVAyCLhS</token>
//    <storage>10</storage>
//    <mail_send>0</mail_send>
//    <uid_owner>zimbra</uid_owner>
//    <storage_id>home::zimbra</storage_id>
//    <file_parent>13487</file_parent>
//    <share_with_displayname/>
//    <displayname_owner>zimbra</displayname_owner>
//    <mimetype>text/plain</mimetype>
//    <isPreviewAvailable>1</isPreviewAvailable>
//    <icon>/core/img/filetypes/text.svg</icon>
// </element>

public class Share
{
  private final int mId;
  private final String mItemType;
  private final String mItemSource;
  private final String mParent;
  private final String mShareType;
  private final String mShareWith;
  private final String mFileSource;
  private final String mFileTarget;
  private final String mPath;
  private final String mPermissions;
  private final Date mSTime;
  private final Date mExpiration;
  private final String mToken;
  private final String mStorage;
  private final String mMailSend;
  private final String mUidOwner;
  private final String mStorageId;
  private final String mFileParent;
  private final String mShareWithDisplayname;
  private final String mDisplaynameOwner;
  private final String mMimeType;
  private final boolean mIsPreviewAvailable;
  private final String mIcon;

  public Share(
    int id,
    String itemType,
    String itemSource,
    String parent,
    String shareType,
    String shareWith,
    String fileSource,
    String fileTarget,
    String path,
    String permissions,
    Date sTime,
    Date expiration,
    String token,
    String storage,
    String mailSend,
    String uidOwner,
    String storageId,
    String fileParent,
    String shareWithDisplayname,
    String displaynameOwner,
    String mimeType,
    boolean isPreviewAvailable,
    String icon
  )
  {
    mId = id;
    mItemType = itemType;
    mItemSource = itemSource;
    mParent = parent;
    mShareType = shareType;
    mShareWith = shareWith;
    mFileSource = fileSource;
    mFileTarget = fileTarget;
    mPath = path;
    mPermissions = permissions;
    mSTime = sTime;
    mExpiration = expiration;
    mToken = token;
    mStorage = storage;
    mMailSend = mailSend;
    mUidOwner = uidOwner;
    mStorageId = storageId;
    mFileParent = fileParent;
    mShareWithDisplayname = shareWithDisplayname;
    mDisplaynameOwner = displaynameOwner;
    mMimeType = mimeType;
    mIsPreviewAvailable = isPreviewAvailable;
    mIcon = icon;
  }

  public int getId()
  {
    return mId;
  }

  public String getItemType()
  {
    return mItemType;
  }

  public String getItemSource()
  {
    return mItemSource;
  }

  public String getParent()
  {
    return mParent;
  }

  public String getShareType()
  {
    return mShareType;
  }

  public String getShareWith()
  {
    return mShareWith;
  }

  public String getFileSource()
  {
    return mFileSource;
  }

  public String getFileTarget()
  {
    return mFileTarget;
  }

  public String getPath()
  {
    return mPath;
  }

  public String getPermissions()
  {
    return mPermissions;
  }

  public Date getSTime()
  {
    return mSTime;
  }

  public Date getExpiration()
  {
    return mExpiration;
  }

  public String getToken()
  {
    return mToken;
  }

  public String getStorage()
  {
    return mStorage;
  }

  public String getMailSend()
  {
    return mMailSend;
  }

  public String getUidOwner()
  {
    return mUidOwner;
  }

  public String getStorageId()
  {
    return mStorageId;
  }

  public String getFileParent()
  {
    return mFileParent;
  }

  public String getShareWithDisplayname()
  {
    return mShareWithDisplayname;
  }

  public String getDisplaynameOwner()
  {
    return mDisplaynameOwner;
  }

  public String getMimeType()
  {
    return mMimeType;
  }

  public boolean isPreviewAvailable()
  {
    return mIsPreviewAvailable;
  }

  public String getIcon()
  {
    return mIcon;
  }

  public static Share fromElement(Element item)
  {
    Date stime = null;
    if (!"".equals(item.getElementsByTagName("stime").item(0).getTextContent()))
    {
      stime = new Date(Long.parseLong(item.getElementsByTagName("stime").item(0).getTextContent()));
    }
    Date expiration = null;
    if (!"".equals(item.getElementsByTagName("expiration").item(0).getTextContent()))
    {
      expiration = new Date(Long.parseLong(item.getElementsByTagName("expiration").item(0).getTextContent()));
    }

    return new Share(
      Integer.parseInt(item.getElementsByTagName("id").item(0).getTextContent()),
      item.getElementsByTagName("item_type").item(0) != null ? item.getElementsByTagName("item_type").item(0).getTextContent() : null,
      item.getElementsByTagName("item_source").item(0) != null ? item.getElementsByTagName("item_source").item(0).getTextContent() : null,
      item.getElementsByTagName("parent").item(0) != null ? item.getElementsByTagName("parent").item(0).getTextContent() : null,
      item.getElementsByTagName("share_type").item(0) != null ? item.getElementsByTagName("share_type").item(0).getTextContent() : null,
      item.getElementsByTagName("share_with").item(0) != null ? item.getElementsByTagName("share_with").item(0).getTextContent() : null,
      item.getElementsByTagName("file_source").item(0) != null ? item.getElementsByTagName("file_source").item(0).getTextContent() : null,
      item.getElementsByTagName("file_target").item(0) != null ? item.getElementsByTagName("file_target").item(0).getTextContent() : null,
      item.getElementsByTagName("path").item(0) != null ? item.getElementsByTagName("path").item(0).getTextContent() : null,
      item.getElementsByTagName("permissions").item(0) != null ? item.getElementsByTagName("permissions").item(0).getTextContent() : null,
      stime,
      expiration,
      item.getElementsByTagName("token").item(0) != null ? item.getElementsByTagName("token").item(0).getTextContent() : null,
      item.getElementsByTagName("storage").item(0) != null ? item.getElementsByTagName("storage").item(0).getTextContent() : null,
      item.getElementsByTagName("mail_send").item(0) != null ? item.getElementsByTagName("mail_send").item(0).getTextContent() : null,
      item.getElementsByTagName("uid_owner").item(0) != null ? item.getElementsByTagName("uid_owner").item(0).getTextContent() : null,
      item.getElementsByTagName("storage_id").item(0) != null ? item.getElementsByTagName("storage_id").item(0).getTextContent() : null,
      item.getElementsByTagName("file_parent").item(0) != null ? item.getElementsByTagName("file_parent").item(0).getTextContent() : null,
      item.getElementsByTagName("share_with_displayname").item(0) != null ? item.getElementsByTagName("share_with_displayname").item(0).getTextContent() : null,
      item.getElementsByTagName("displayname_owner").item(0) != null ? item.getElementsByTagName("displayname_owner").item(0).getTextContent() : null,
      item.getElementsByTagName("mimetype").item(0) != null ? item.getElementsByTagName("mimetype").item(0).getTextContent() : null,
      item.getElementsByTagName("isPreviewAvailable").item(0) != null && "1".equals(item.getElementsByTagName("isPreviewAvailable").item(0).getTextContent()),
      item.getElementsByTagName("icon").item(0) != null ? item.getElementsByTagName("icon").item(0).getTextContent() : null
    );
  }
}
