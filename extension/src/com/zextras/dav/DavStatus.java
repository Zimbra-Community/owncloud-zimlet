package com.zextras.dav;

/**
 * Status codes returned from a DAV server.
 */
public enum DavStatus
{
    Continue(100),
    Switching_Protocols(101),
    Processing(102),
    OK(200),
    Created(201),
    Accepted(202),
    None_Authoritative_Information(203),
    No_Content(204),
    Reset_Content(205),
    Partial_Content(206),
    Multi_Status(207),
    Multiple_Choices(300),
    Moved_Permanently(301),
    Found(302),
    See_Other(303),
    Not_Modified(304),
    Use_Proxy(305),
    Redirect(307),
    Bad_Request(400),
    Unauthorized(401),
    Payment_Required(402),
    Forbidden(403),
    Not_Found(404),
    Method_Not_Allowed(405),
    Not_Acceptable(406),
    Proxy_Authentication_Required(407),
    Request_Time_out(408),
    Conflict(409),
    Gone(410),
    Length_Required(411),
    Precondition_Failed(412),
    Request_Entity_Too_Large(413),
    Request_URI_Too_Large(414),
    Unsupported_Media_Type(415),
    Requested_range_not_satisfiable(416),
    Expectation_Failed(417),
    Unprocessable_Entity(422),
    Locked(423),
    Failed_Dependency(424),
    Internal_Server_Error(500),
    Not_Implemented(501),
    Bad_Gateway(502),
    Service_Unavailable(503),
    Gateway_Time_out(504),
    HTTP_Version_not_supported(505),
    Insufficient_Storage(507);

  private final int mCode;

  DavStatus(int code)
  {
    mCode = code;
  }

  public int getCode()
  {
    return mCode;
  }

  /**
   * Convert the status into a DavStatus, starting from the code.
   * @param status The status code
   * @return The DavStatus
   */
  public static DavStatus fromCode(int status)
  {
    for (DavStatus enumStatus : DavStatus.values())
    {
      if (status == enumStatus.getCode())
      {
        return enumStatus;
      }
    }
    throw new RuntimeException("Status '" + status + "' not handled.");
  }

}
