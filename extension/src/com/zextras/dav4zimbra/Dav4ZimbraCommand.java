package com.zextras.dav4zimbra;

public enum Dav4ZimbraCommand
{
  SEND_ITEM_TO_DAV("sendItemToDav"),
  SEND_MAIL_ATTACHMENT_TO_DAV("sendMailAttachmentToDav");

  private final String mAction;

  Dav4ZimbraCommand(String action)
  {
    mAction = action;
  }

  public String value()
  {
    return mAction;
  }

  public static Dav4ZimbraCommand fromString(String command)
  {
    for (Dav4ZimbraCommand enumCommand : Dav4ZimbraCommand.values())
    {
      if (command.equals(enumCommand.value()) || command.equals(enumCommand.value().toLowerCase()))
      {
        return enumCommand;
      }
    }
    throw new RuntimeException("Command '" + command + "' not handled.");
  }
}
