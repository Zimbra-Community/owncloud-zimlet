package com.zextras;

import org.json.JSONArray;
import org.json.JSONObject;

public class SoapUtil
{
  public static JSONObject encodeError(Throwable error)
  {
    JSONObject errorObj = new JSONObject();
    JSONArray stackArr = new JSONArray();
    for (StackTraceElement el : error.getStackTrace()) {
      stackArr.put(el.toString());
    }
    errorObj.put("message", error.getMessage());
    errorObj.put("trace", stackArr);
    if (error.getCause() != null)
    {
      errorObj.put("cause", encodeError(error.getCause()));
    }
    return errorObj;
  }
}
