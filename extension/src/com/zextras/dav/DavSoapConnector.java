package com.zextras.dav;


import com.github.sardine.DavResource;
import com.github.sardine.Sardine;
import com.github.sardine.SardineFactory;
import com.github.sardine.impl.SardineException;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.xml.namespace.QName;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.net.URL;

import org.apache.commons.codec.binary.Base64InputStream;

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
    String password,
    String originatingIP
  )
  {
    mUrl = url;
    mPort = port;
    mBasePath = basePath;

    mSardine = SardineFactory.begin(username, password, originatingIP);
    mSardine.enableCompression();
    try {                                                                                                                                                                   
        mSardine.enablePreemptiveAuthentication(new URL(url));
    } catch(Exception ex) {

    }
  }

  /**
   * Build a complete path suitable for a DAV client.
   * The path will be sanitized.
   * @param path The path suffix.
   * @return The complete DAV Path.
   */
  protected String buildUrl(String path)
  {
    final String url;
    if (path.startsWith(mBasePath))
      url = mUrl + ":" + mPort + path;
    else
      url = mUrl + ":" + mPort + mBasePath + path;

    return url;
  }

  /**
   * Perform a COPY request.
   * Create a copy of a resource
   * @param path The resource path.
   * @param destPath The path to copy the resource to.
   * @param overwrite Whether or not to fail when the resource already exists.
   * @return True if the command is not failed.
   * @throws IOException
   */
  public boolean copy(String path, String destPath, boolean overwrite)
    throws IOException
  {
    mSardine.copy(
      buildUrl(path),
      buildUrl(destPath),
      overwrite
    );
    return true;
  }

  /**
   * Perform a DELETE request.
   * Remove a resource (recursively)
   * @param path The resource path.
   * @return True if the command is not failed.
   * @throws IOException
   */
  public boolean delete(String path)
    throws IOException
  {
    mSardine.delete(buildUrl(path));
    return true;
  }

  /**
   * Perform a GET request.
   * Retrieve the contents of a resource.
   *
   * This method should be replaced, as well as OwnCloudCommons.prototype._getResourceCbk in ownCloudCommons.js as
   * this approach sends the file to attach from DAV server to the Client and then to the Zimbra server.
   *
   * Suggested solution is to call saveUpload method from FileUploadServlet.java from Zimbra Source or make
   * a wrapper for this in OpenZAL and to send the attachment from DAV server, directly to Zimbra and only
   * send the ID of the attachment to the client for saveDraft.
   *
   * @param path The resource path.
   * @return The content of the file, inside a StringBuilder.
   * @throws IOException
   */
  public StringBuilder get(String path)
    throws IOException
  {
    InputStream inputStream = mSardine.get(buildUrl(path));
    Base64InputStream b64is = new Base64InputStream(inputStream, true);
    BufferedReader br = new BufferedReader(new InputStreamReader(b64is));
    StringBuilder sb = new StringBuilder();
    String line;
    while ((line = br.readLine()) != null) {
      sb.append(line);
    }
    inputStream.close();
    return sb;
  }

  /**
   * Perform a GET request and return the content as stream.
   * Retrieve the contents of a resource.
   * @param path The resource path.
   * @return The content of the file, inside a StringBuilder.
   * @throws IOException
   */
  public InputStream getAsStream(String path) throws IOException
  {
    return mSardine.get(buildUrl(path));
  }

  /**
   * Perform a MOVE request.
   * Move a resource from location
   * @param path The resource path.
   * @param destPath The path to copy the resource to.
   * @param overwrite Whether or not to fail when the resource already exists.
   * @return True if the command is not failed.
   * @throws IOException
   */
  public boolean move(String path, String destPath, boolean overwrite)
    throws IOException
  {
    mSardine.move(
      buildUrl(path),
      buildUrl(destPath),
      overwrite
    );
    return true;
  }

  /**
   * Perform a MKCOL request.
   * Create a collection.
   * @param path The path which will be created.
   * @return True if the command is not failed.
   * @throws IOException
   */
  public DavStatus mkcol(String path)
    throws IOException
  {
    try
    {
      mSardine.createDirectory(buildUrl(path));
    }
    catch (SardineException se)
    {
      return DavStatus.fromCode(se.getStatusCode());
    }
    return DavStatus.Created;
  }

  /**
   * Perform a PROPFIND request.
   * Read the metadata of a resource (optionally including its children).
   * @param path The path of the resource.
   * @param depth control recursion default 0 (only returning the properties for the resource itself).
   * @return The resource structure returned by the request.
   * @throws IOException
   *
   * Implement Custom DAV Property oc:fileid, needed for OnlyOffice and other integrations
   * {http://owncloud.org/ns}fileid The unique id for the file within the instance
   * https://docs.nextcloud.com/server/12/developer_manual/client_apis/WebDAV/index.html
   */
  public JSONArray propfind(String path, int depth)
    throws IOException
  {
    final JSONArray arrayResponse = new JSONArray();
    //to-do: check if this breaks WebDAV Servers that do not implement this, aka Alfresco,
    //if it breaks, make it configurable
    Set<QName> CustomProps = new HashSet<QName>();
    CustomProps.add(new QName("http://owncloud.org/ns", "fileid", "oc"));
    CustomProps.add(new QName("DAV:", "getcontentlength", "d"));
    CustomProps.add(new QName("DAV:", "getlastmodified", "d"));
    CustomProps.add(new QName("DAV:", "getcontenttype", "d"));
    CustomProps.add(new QName("DAV:", "resourcetype", "d"));
    List<DavResource> propfind = mSardine.propfind(
      buildUrl(path),
      depth,
      CustomProps
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
   * Perform a PUT request.
   * Save the contents of a resource to the server.
   * @param path
   * @param inputStream
   * @throws IOException
   */
  public DavStatus put(String path, InputStream inputStream)
    throws IOException
  {
    try
    {
      mSardine.put(
        buildUrl(path),
        inputStream
      );
    }
    catch (SardineException se)
    {
      return DavStatus.fromCode(se.getStatusCode());
    }
    return DavStatus.Created;
  }

  /**
   * Perform a PUT request.
   * Save the contents of a resource to the server.
   * @param path
   * @param inputStream
   * @param contentType
   * @throws IOException
   */
  public DavStatus put(String path, InputStream inputStream, String contentType)
    throws IOException
  {
    try
    {
      mSardine.put(
        buildUrl(path),
        inputStream,
        contentType
      );
    }
    catch (SardineException se)
    {
      return DavStatus.fromCode(se.getStatusCode());
    }
    return DavStatus.Created;
  }

  /**
   * Perform a SEARCH request.
   * Search for files by property, currently only displayname implemented, supports % wildcard
   * @param {string} search, string to look for
   * @param {string} url, full url to WebDAV interface
   * @param {string} path, folder to search in)
   * @return The resource structure returned by the request.
   * @throws IOException
   */
  public JSONArray search(String search, String path)
          throws IOException
  {
    final JSONArray arrayResponse = new JSONArray();
    List<DavResource> searchResult = mSardine.search(
            search,
            buildUrl("/"),
            path
    );

    for (DavResource resource : searchResult)
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
}
