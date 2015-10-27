package com.zextras.owncloud;

/**
 * Commands handled by the OwnCloud connector.
 */
public enum OwnCloudCommand
{
  GET_ALL_SHARES("getAllShares"),
  GET_SHARES_FROM_FOLDER("getSharesFromFolder"),
  GET_SHARE_BY_ID("getShareById"),
  CREATE_SHARE("createShare"),
  DELETE_SHARE_BY_ID("deleteShareById"),
  UPDATE_SHARE("updateShare");

  private final String mAction;

  OwnCloudCommand(String action)
  {
    mAction = action;
  }

  public String value()
  {
    return mAction;
  }

  /**
   * Convert a string into the correct OwnCloudCommand.
   * @param command The command as string.
   * @return The OwnCloudCommand.
   */
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
