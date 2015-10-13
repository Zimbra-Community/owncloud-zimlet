package com.zextras.dav;

import com.github.sardine.DavResource;
import com.github.sardine.Sardine;
import com.github.sardine.SardineFactory;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.xml.namespace.QName;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;

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

  public JSONObject get(String path)
    throws IOException
  {
    final JSONObject response = new JSONObject();
    mSardine.get(buildUrl(path));
    return response;
  }

}
