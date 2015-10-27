package com.zextras.owncloud.proxy;

import javax.servlet.ServletOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

class JavascriptFilter implements FilterStrategy
{
  @Override
  public void filter(ByteArrayOutputStream byteArrayOutputStream, ServletOutputStream servletOutputStream)
    throws IOException
  {
    String text = byteArrayOutputStream.toString("UTF-8");

    {
      Pattern hrefPattern = Pattern.compile("var oc_webroot=\"[^\"]*\"");
      Matcher matcher = hrefPattern.matcher(text);
      text = matcher.replaceAll("var oc_webroot=\""+ OwnCloudProxyHandler.sExtensionPath+"\"");
    }

    {
      Pattern hrefPattern = Pattern.compile("var oc_appswebroots=([{][^{]*[}])");
      Matcher matcher = hrefPattern.matcher(text);
      if (matcher.find())
      {
        String urls = matcher.group(1).replaceAll("/apps/", OwnCloudProxyHandler.sExtensionPath + "/apps/");;
        text = matcher.replaceFirst("var oc_appswebroots=" + urls);
      }
    }

    servletOutputStream.write(text.getBytes("UTF-8"));
    servletOutputStream.flush();
    byteArrayOutputStream.reset();
  }
}
