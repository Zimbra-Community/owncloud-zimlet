package com.zextras.dav;

/**
 * Defines which commands are handled by the connector.
 */
public enum DavCommand
{
  GET, PUT, PROPFIND, DELETE, MKCOL, COPY, MOVE;

  public static DavCommand fromString(String command)
  {
    for (DavCommand enumCommand : DavCommand.values())
    {
      if (command.equals(enumCommand.name()) || command.equals(enumCommand.name().toLowerCase()))
      {
        return enumCommand;
      }
    }
    throw new RuntimeException("Command '" + command + "' not handled.");
  }
}
