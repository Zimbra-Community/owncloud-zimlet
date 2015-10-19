package com.zextras.owncloud;

public enum OwnCloudCommand
{
  GET_ALL_SHARES("getAllShares"),
  GET_SHARES_FROM_FOLDER("getSharesFromFolder"),
  GET_SHARE_BY_ID("getShareById");

  private final String mAction;

  OwnCloudCommand(String action)
  {
    mAction = action;
  }

  public String value()
  {
    return mAction;
  }

  public static OwnCloudCommand fromString(String command)
  {
    for (OwnCloudCommand enumCommand : OwnCloudCommand.values())
    {
      if (command.equals(enumCommand.value()) || command.equals(enumCommand.value().toLowerCase()))
      {
        return enumCommand;
      }
    }
    throw new RuntimeException("Command '" + command + "' not handled.");
  }
}
