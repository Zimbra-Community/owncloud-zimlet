package com.zextras.dav;

import com.github.sardine.DavResource;
import com.github.sardine.Sardine;
import com.github.sardine.SardineFactory;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.xml.namespace.QName;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.List;

/**
 *
 */
public class DavSoapConnector
{
  private final String mUrl;
  private final int mPort;
  private final String mBasePath;
  private final Sardine mSardine;

  public DavSoapConnector(
    String url,
    int port,
    String basePath
  )
  {
    mUrl = url;
    mPort = port;
    mBasePath = basePath;

    mSardine = SardineFactory.begin();
    mSardine.enableCompression();
  }

  public DavSoapConnector(
    String url,
    int port,
    String basePath,
    String username,
    String password
  )
  {
    mUrl = url;
    mPort = port;
    mBasePath = basePath;

    mSardine = SardineFactory.begin(username, password);
    mSardine.enableCompression();
  }

  private String buildUrl()
  {
    return buildUrl("");
  }

  private String buildUrl(String path)
  {
    if (path.startsWith(mBasePath))
      return mUrl + ":" + mPort + path;
    else
      return mUrl + ":" + mPort + mBasePath + path;
  }

  public JSONArray propfind(String path, int depth)
    throws IOException
  {
    final JSONArray arrayResponse = new JSONArray();
    List<DavResource> propfind = mSardine.propfind(
      buildUrl(path),
      depth,
      new HashSet<QName>()
    );

    for (DavResource resource : propfind)
    {
      JSONObject res = new JSONObject();
      res.put("name", resource.getName());
      res.put("path", resource.getPath());
      res.put("isDirectory", resource.isDirectory());
      arrayResponse.put(res);
    }
    return arrayResponse;
  }

  public StringBuilder get(String path)
    throws IOException
  {
    InputStream inputStream = mSardine.get(buildUrl(path));
    BufferedReader br = new BufferedReader(new InputStreamReader(inputStream));
    StringBuilder sb = new StringBuilder();
    String line;
    while ((line = br.readLine()) != null) {
      sb.append(line);
    }
    inputStream.close();
    return sb;
  }

  public boolean mkcol(String path)
    throws IOException
  {
    mSardine.createDirectory(path);
    return true;
  }
}
