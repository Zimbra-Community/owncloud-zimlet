package com.zextras.dav;

import org.openzal.zal.http.HttpHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class DownloadHandler implements HttpHandler
{
  private final Map<String, DownloadJob> mDownloadJobMap;

  public DownloadHandler(Map<String, DownloadJob> downloadJobMap)
  {
    mDownloadJobMap = downloadJobMap;
  }

  @Override
  public void doGet(
    HttpServletRequest httpServletRequest,
    HttpServletResponse httpServletResponse
  )
    throws ServletException, IOException
  {
    Map<String, String> paramsMap = new HashMap<String, String>();

    String[] params = httpServletRequest.getQueryString().split("&");
    for (String param : params)
    {
      String[] subParam = param.split("=");
      paramsMap.put(subParam[0], subParam[1]);
    }
    String token = paramsMap.get("token");
    String inline = paramsMap.get("inline");


    if (mDownloadJobMap.containsKey(token)) {
      DownloadJob job = mDownloadJobMap.get(token);
      if (!job.expired())  {
        if(!"true".equals(inline)) {
          httpServletResponse.addHeader("Content-Disposition", "attachment");
        }
        else
        {
          httpServletResponse.addHeader("Content-Disposition", "inline");
          httpServletResponse.addHeader("Accept-Ranges", "none");
        }
        if (paramsMap.containsKey("contentType"))
        {
          httpServletResponse.addHeader("Content-Type", paramsMap.get("contentType"));
        }

        DavSoapConnector connector = job.getConnector();
        InputStream fileStream = connector.getAsStream(job.getPath());
        OutputStream outputStream = httpServletResponse.getOutputStream();
        byte[] buffer = new byte[64 * 1024];
        int quantity;
        try {
          while(true) {
            quantity = fileStream.read(buffer);
            if (quantity <= 0) break;
            outputStream.write(buffer, 0, quantity);
          }
        } finally
        {
          mDownloadJobMap.remove(job.getToken());
          outputStream.flush();
          fileStream.close();
        }
      }
    }
  }

  @Override
  public void doPost(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse)
    throws ServletException, IOException
  {}

  @Override
  public void doOptions(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse)
    throws ServletException, IOException
  {}

  @Override
  public String getPath()
  {
    return "dav_download";
  }
}
