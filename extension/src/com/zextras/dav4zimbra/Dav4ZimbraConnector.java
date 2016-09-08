package com.zextras.dav4zimbra;


import com.zextras.dav.DavSoapConnector;
import com.zextras.dav.DavStatus;
import org.openzal.zal.*;
import org.openzal.zal.calendar.Invite;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimePart;
import java.io.IOException;
import java.io.InputStream;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * This class provide an abstraction layer to handle Zimbra objects from/to DAV mount point.
 * The return values can be used into a SOAP response.
 */
public class Dav4ZimbraConnector extends DavSoapConnector
{
  private final MailboxManager mMailboxManager;
  private final String mZimbraMailsPath;

  public Dav4ZimbraConnector(
    MailboxManager mailboxManager,
    String url,
    int port,
    String basePath,
    String username,
    String password,
    String zimbraMailsPath
  )
  {
    super(url, port, basePath, username, password);
    mZimbraMailsPath = zimbraMailsPath;
    mMailboxManager = mailboxManager;
  }

  /**
   * Send a Zimbra item on an OwnCloud installation as file.
   * TODO: Check the file existence before to send it.
   * @param accountId The zimbra account id.
   * @param mailItemType The item type.
   * @param itemId The item ID.
   * @return The status code of the DAV action.
   * @throws IOException
   * @throws MessagingException
   */
  public DavStatus sendItemToDav(
    String accountId,
    MailItemType mailItemType,
    int itemId
  )
    throws IOException, MessagingException
  {
    final Mailbox mailbox = mMailboxManager.getMailboxByAccountId(accountId);
    final InputStream inputStream;
    final String mimeType;
    final String fileName;

    if (mailItemType.toByte() == MailItemType.APPOINTMENT.toByte() || mailItemType.toByte() == MailItemType.TASK.toByte())
    {
      CalendarItem item = mailbox.getCalendarItemById(
        mailbox.newOperationContext(),
        itemId
      );
      Invite defaultInviteOrNull = item.getDefaultInviteOrNull();
      if (defaultInviteOrNull == null)
      {
        throw new RuntimeException("Unable to export ICal.");
      }
      mimeType = "text/calendar";
      fileName = getFileName(item, mailItemType.toByte() == MailItemType.TASK.toByte());
      inputStream = defaultInviteOrNull.toIcal();
    }
    else if (mailItemType.toByte() == MailItemType.DOCUMENT.toByte())
    {
      Document item = mailbox.getItemById(
        mailbox.newOperationContext(),
        itemId,
        mailItemType.toByte()
      ).toDocument();
      mimeType = item.getContentType();
      fileName = item.getName();
      inputStream = item.getContentStream();
    }
    else if (mailItemType.toByte() == MailItemType.CONTACT.toByte())
    {
      Contact item = mailbox.getContactById(
        mailbox.newOperationContext(),
        itemId
      );
      mimeType = "text/vcard";
      fileName = getFileName(item);
      inputStream = item.toVCardInputStream();
    }
    else if (mailItemType.toByte() == MailItemType.MESSAGE.toByte())
    {
      Message item = mailbox.getMessageById(
        mailbox.newOperationContext(),
        itemId
      );
      mimeType = "message/rfc822";
      fileName = getFileName(item);
      inputStream = item.getContentStream();
    }
    else
    {
      throw new RuntimeException("Mail item type '" + mailItemType + "' not handled.");
    }
    String sanitizedFileName = fileName.replaceAll("\\\\|\\/|\\:|\\*|\\?|\\\"|\\<|\\>|\\||\\%|\\&|\\@|\\!|\\'|\\[|\\]", "");
    return put(
      mZimbraMailsPath + "/" + sanitizedFileName.replace("/", "_"),
      inputStream,
      mimeType
    );
  }

  /**
   * Send an attachment of a message to a DAV mount point.
   * TODO: Check the file existence before to send it.
   * @param zimbraAccountId The account ID.
   * @param mid The message ID.
   * @param part The part number.
   * @param fileName The filename suggested for the part.
   * @return The status code of the DAV action.
   * @throws MessagingException
   * @throws IOException
   */
  public DavStatus sendMailAttachmentToDav(
    String zimbraAccountId,
    int mid,
    String part,
    String fileName
  )
    throws MessagingException, IOException
  {
    final Mailbox mailbox = mMailboxManager.getMailboxByAccountId(zimbraAccountId);
    final Message message = mailbox.getMessageById(mailbox.newOperationContext(), mid);
    final MimePart attachment = getAttachment(message, part);
    return put(
      mZimbraMailsPath + "/" + fileName.replace("/", "_"),
      attachment.getInputStream(),
      attachment.getContentType()
    );
  }

  /**
   * Generate the file name for a Contact Item.
   * @param item The Item
   * @return The file name proposed.
   */
   /**
    *
    * WARNING: getFileName method is not UTF8 proof and its use should be avoided
    * see: https://github.com/Zimbra-Community/owncloud-zimlet/issues/73
    * and https://github.com/Zimbra-Community/owncloud-zimlet/commit/bb67b170f6867bd2ddbb85249f696ed55262ee94
    * After looking deeper it seem like getFileName method was designed to encode filenames for inside a mime header and
    * as such is not to be used for sending over http (eg. use with URI/URL). 
    *  
    */
  private String getFileName(Contact item)
  {
    String firstName = item.get("firstName");
    String lastName = item.get("lastName");
    String tmpFileName = (lastName != null) ? lastName : "";
    if (tmpFileName.equals(""))
    {
      tmpFileName += (firstName != null) ? firstName : "";
    }
    else
    {
      tmpFileName += (firstName != null) ? ", " + firstName : "";
    }
    if (tmpFileName.equals(""))
    {
      for (String email : item.getEmailAddresses())
      {
        tmpFileName = email;
        break;
      }
    }
    return tmpFileName + ".vcf";
  }

  /**
   * Generate the file name for a Calendar Item.
   * @param item The Item
   * @param isTask Set if the item represents a task.
   * @return The file name proposed.
   */
  private String getFileName(CalendarItem item, boolean isTask)
  {
    DateFormat df = new SimpleDateFormat("yyyy-MM-dd HH.mm");
    String tmpFileName = "";
    if (isTask)
    {
      tmpFileName = " Task";
    }

    if (!item.getSubject().equals(""))
    {
      tmpFileName = " - " + item.getSubject();
    }
    return df.format(new Date(item.getStartTime())) + tmpFileName + ".ics";
  }

  /**
   * Generate the file name for a Message Item.
   * @param item The Item
   * @return The file name proposed.
   */
  private String getFileName(Message item)
  {
    return getMessageSubject(item) + ".eml";
  }

  private String getFileName(String suggestedFileName, String messageSubject, MimePart part, String partNumber)
    throws MessagingException
  {
    String contentType = part.getContentType();
    if (part.getFileName() != null) return part.getFileName();

    String tmpName;
    if (suggestedFileName == null)
    {
      tmpName = messageSubject + " part " + partNumber;
    }
    else
    {
      tmpName = suggestedFileName;
    }
    if (contentType.startsWith("message/rfc822"))
    {
      return tmpName + ".eml";
    }
    return tmpName;
  }

  private String getMessageSubject(Message item)
  {
    if (item.getSubject().equals(""))
    {
      return "Message " + item.getId();
    }
    else
    {
      return item.getSubject();
    }
  }

  /**
   * Get an attachment of a mail message.
   * @param message The message
   * @param bodyPartId The body part requested.
   * @return The mime part if exists.
   * @throws MessagingException
   * @throws IOException
   */
  private MimePart getAttachment(Message message, String bodyPartId)
    throws MessagingException, IOException
  {
    MimeMessage mimeMessage = Mime.expandMessage(message.getMimeMessage());

    if (mimeMessage.getContentType().toLowerCase().startsWith("multipart"))
    {
      MimePart mimePart = Mime.getMimePart(
        mimeMessage,
        bodyPartId
      );

      if( mimePart != null )
      {
        return mimePart;
      }
    }
    throw new IOException("Cannot find attachment "+bodyPartId);
  }

}
