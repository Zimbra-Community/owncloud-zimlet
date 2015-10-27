package com.zextras.owncloud.proxy;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;
import java.io.IOException;

class ContentFilterWrapper extends HttpServletResponseWrapper
{
  private FilterServletOutputStream filter;

  public ContentFilterWrapper(HttpServletResponse response)
  {
    super(response);
    filter = null;
  }

  public ServletOutputStream getOutputStream() throws IOException
  {
    if (getContentType() != null)
    {
      if (getContentType().contains("text/html"))
      {
        filter = new FilterServletOutputStream(
          super.getOutputStream(),
          new HtmlFilter()
        );
      }

      if( getContentType().contains("javascript") )
      {
        filter = new FilterServletOutputStream(
          super.getOutputStream(),
          new JavascriptFilter()
        );
      }
    }

    if( filter != null )
    {
      return filter;
    }
    {
      return super.getOutputStream();
    }
  }

  public void filterAndFlush() throws IOException
  {
    if( filter != null )
    {
      filter.filterAndFlush();
    }
  }
}
