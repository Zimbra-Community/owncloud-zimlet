package com.zextras.owncloud.client.responses;

//<ocs>
//  <meta>
//    <status>failure</status>
//    <statuscode>400</statuscode>
//    <message>Wrong or no update parameter given</message>
//  </meta>
//  <data/>
//</ocs>

import org.w3c.dom.Document;

public class StatusResponse
{
  private final String mStatus;
  private final int mStatuscode;
  private final String mMessage;
  private Document mDocument;

  public StatusResponse(String status, int statuscode, String message)
  {
    mStatus = status;
    mStatuscode = statuscode;
    mMessage = message;
    mDocument = null;
  }

  public String getStatus()
  {
    return mStatus;
  }

  public int getStatuscode()
  {
    return mStatuscode;
  }

  public String getMessage()
  {
    return mMessage;
  }

  public void attachDocument(Document document)
  {
    mDocument = document;
  }

  public Document getDocument()
  {
    return mDocument;
  }
}
