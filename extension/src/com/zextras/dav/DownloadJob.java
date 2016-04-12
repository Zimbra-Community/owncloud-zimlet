package com.zextras.dav;


import org.apache.commons.codec.binary.Hex;

import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

class DownloadJob
{
  private final static long DURATION = 5L * 60000L; // 5 minutes

  private final DavSoapConnector mConnector;
  private final String mPath;
  private final long mCreationTime;

  private String mToken;

  DownloadJob(DavSoapConnector connector, String path)
  {
    mCreationTime = System.currentTimeMillis();
    mConnector = connector;
    mPath = path;
    regenerateToken();
  }

  public String getToken() {
    return mToken;
  }

  public void regenerateToken()
  {
    String stringToken = mCreationTime + "|" + mPath;

    final MessageDigest messageDigest;
    try
    {
      messageDigest = MessageDigest.getInstance("MD5");
      messageDigest.reset();
      messageDigest.update(stringToken.getBytes(Charset.forName("UTF8")));
      final byte[] resultByte = messageDigest.digest();
      mToken = new String(Hex.encodeHex(resultByte));
    } catch (NoSuchAlgorithmException e)
    {
      throw new RuntimeException(e);
    }
  }

  public boolean expired() {
    return System.currentTimeMillis() >= (mCreationTime + DURATION);
  }

  public String getDownloadUrl()
  {
    return "/service/extension/dav_download/?token=" + mToken;
  }

  public String getPath() {
    return mPath;
  }

  public DavSoapConnector getConnector() {
    return mConnector;
  }
}
