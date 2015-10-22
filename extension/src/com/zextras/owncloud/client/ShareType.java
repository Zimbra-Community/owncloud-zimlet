package com.zextras.owncloud.client;


public enum ShareType
{
  USER(0),
  GROUP(1),
  PUBLIC_LINK(3),
  FEDERATED_CLOUD_SHARE(6);

  private final int mCode;

  ShareType(int code)
  {

    mCode = code;
  }

  public static ShareType fromCode(int code)
  {
    for (ShareType shareType : ShareType.values())
    {
      if (code == shareType.getCode())
      {
        return shareType;
      }
    }
    throw new RuntimeException("ShareType '" + code + "' not handled.");
  }

  public int getCode()
  {
    return mCode;
  }
}
