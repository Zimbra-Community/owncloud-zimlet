package com.zextras.owncloud.proxy;

import javax.servlet.ServletOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

class HtmlFilter implements FilterStrategy
{
  @Override
  public void filter(ByteArrayOutputStream byteArrayOutputStream, ServletOutputStream servletOutputStream)
    throws IOException
  {
    //TODO: encoding
    String text = byteArrayOutputStream.toString("UTF-8");

    {
      Pattern hrefPattern = Pattern.compile("href=\"/");
      Matcher matcher = hrefPattern.matcher(text);
      text = matcher.replaceAll("href=\"/service/extension/owncloud/");
    }
    {
      Pattern hrefPattern = Pattern.compile("src=\"/");
      Matcher matcher = hrefPattern.matcher(text);
      text = matcher.replaceAll("src=\"/service/extension/owncloud/");
    }
    {
      Pattern hrefPattern = Pattern.compile("data-url=\"/");
      Matcher matcher = hrefPattern.matcher(text);
      text = matcher.replaceAll("data-url=\""+ OwnCloudProxyHandler.sExtensionPath+"/");
    }

    servletOutputStream.write(text.getBytes("UTF-8"));
    servletOutputStream.flush();
    byteArrayOutputStream.reset();
  }
}
