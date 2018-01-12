package com.zextras.dav;

/**
 * Defines which commands are handled by the connector.
 */
public enum DavCommand
{
  GET, GET_LINK, PUT, PROPFIND, DELETE, MKCOL, COPY, MOVE, SEARCH;

  /**
   * Decode a string into a DavCommand.
   * @param command The string that represents the command.
   * @return The DAV Command.
   */
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
