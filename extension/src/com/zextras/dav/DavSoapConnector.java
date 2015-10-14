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
 * This class provide an abstraction layer to handle a DAV Client return a JSON data.
 * The return values can be used into a SOAP response.
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

  /**
   * Build a complete path suitable for a DAV client.
   * @param path The path suffix.
   * @return The complete DAV Path.
   */
  private String buildUrl(String path)
  {
    if (path.startsWith(mBasePath))
      return mUrl + ":" + mPort + path;
    else
      return mUrl + ":" + mPort + mBasePath + path;
  }

  /**
   * Perform a PROPFIND request.
   * Read the metadata of a resource (optionally including its children).
   * @param path The path of the resource.
   * @param depth control recursion default 0 (only returning the properties for the resource itself).
   * @return The resource structure returned by the request.
   * @throws IOException
   */
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
      res.put("href", resource.getPath());
      if (resource.getCreation() != null)
      {
        res.put("creation", resource.getCreation().getTime());
      }
      if (resource.getModified() != null)
      {
        res.put("modified", resource.getModified().getTime());
      }
      res.put("contentType", resource.getContentType());
      res.put("contentLength", resource.getContentLength());
      res.put("etag", resource.getEtag());
      res.put("displayName", resource.getDisplayName());

      JSONArray resourceTypes = new JSONArray();
      for (QName name : resource.getResourceTypes())
      {
        resourceTypes.put("{" + name.getNamespaceURI() + "}" + name.getLocalPart());
      }
      res.put("resourceTypes", resourceTypes);
      res.put("contentLanguage", resource.getContentLanguage());
      JSONArray supportedReports = new JSONArray();
      for (QName name : resource.getSupportedReports())
      {
        supportedReports.put("{" + name.getNamespaceURI() + "}" + name.getLocalPart());
      }
      res.put("supportedReports", supportedReports);
      JSONObject customProps = new JSONObject();
      for (String key : resource.getCustomProps().keySet())
      {
        customProps.put(key, resource.getCustomProps().get(key));
      }
      res.put("customProps", customProps);
      arrayResponse.put(res);
    }
    return arrayResponse;
  }

  /**
   * Perform a GET request.
   * Retrieve the contents of a resource.
   * @param path The resource path.
   * @return The content of the file, inside a StringBuilder.
   * @throws IOException
   */
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

  /**
   * Perform a MKCOL request.
   * Create a collection.
   * @param path The path which will be created.
   * @return True if the request was handled correctly.
   * @throws IOException
   */
  public boolean mkcol(String path)
    throws IOException
  {
    mSardine.createDirectory(buildUrl(path));
    return true;
  }
}
