package com.zextras.owncloud;


public enum Permission
{
  READ(1),
  UPDATE(2),
  CREATE(4),
  DELETE(8),
  SHARE(16),
  ALL(31);

  private final int mCode;

  Permission(int code)
  {

    mCode = code;
  }

  public static Permission fromCode(int code)
  {
    for (Permission permission : Permission.values())
    {
      if (code == permission.getCode())
      {
        return permission;
      }
    }
    throw new RuntimeException("Permission '" + code + "' not handled.");
  }

  public int getCode()
  {
    return mCode;
  }
}
