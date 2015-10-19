package com.zextras.owncloud.client.handlers;


import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.StatusLine;
import org.apache.http.client.ResponseHandler;

/**
 * Basic response handler which takes an url for documentation.
 *
 * @param <T> return type of {@link ResponseHandler#handleResponse(HttpResponse)}.
 * @author mirko
 */
public abstract class ValidatingResponseHandler<T> implements ResponseHandler<T>
{
  /**
   * Checks the response for a statuscode between {@link HttpStatus#SC_OK} and {@link HttpStatus#SC_MULTIPLE_CHOICES}
   * and throws an {@link com.github.sardine.impl.SardineException} otherwise.
   *
   * @param response to check
   */
  protected void validateResponse(HttpResponse response)
  {
    StatusLine statusLine = response.getStatusLine();
    int statusCode = statusLine.getStatusCode();
    if (statusCode >= HttpStatus.SC_OK && statusCode < HttpStatus.SC_MULTIPLE_CHOICES)
    {
      return;
    }
    throw new RuntimeException("Unexpected response '" + statusLine.getStatusCode() + "'");
  }
}
