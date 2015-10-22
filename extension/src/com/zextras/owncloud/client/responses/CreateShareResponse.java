package com.zextras.owncloud.client.responses;


public class CreateShareResponse extends StatusResponse
{
  private final int mShareId;
  private final String mUrl;
  private final String mToken;

  public CreateShareResponse(
    String status,
    int statuscode,
    String message,
    int shareId,
    String url,
    String token
  )
  {
    super(status, statuscode, message);
    mShareId = shareId;
    mUrl = url;
    mToken = token;
  }

  public int getShareId()
  {
    return mShareId;
  }

  public String getUrl()
  {
    return mUrl;
  }

  public String getToken()
  {
    return mToken;
  }
}
