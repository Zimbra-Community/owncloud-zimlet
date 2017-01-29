/*
This class handles uploads from the Zimbra webclient to the DAV server. 
*/

package com.zextras.dav;


import com.zextras.Zimlet;
import com.zextras.util.UserPropertyExtractor;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.openzal.zal.Account;
import org.openzal.zal.AuthToken;
import org.openzal.zal.Provisioning;
import org.openzal.zal.exceptions.AuthTokenException;
import org.openzal.zal.http.HttpHandler;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;

import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.Properties;


public class UploadHandler implements HttpHandler {
    private final Provisioning mProvisioning;

    public UploadHandler(Provisioning provisioning) {
        mProvisioning = provisioning;
    }

    @Override
    public void doGet(
            HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse
    )
            throws ServletException, IOException {
    }

    /* This is called when the Upload button is used in the WebDAV Tab Application */
    @Override
    public void doPost(
            HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse
    )
            throws ServletException, IOException {
        final Map<String, String> paramsMap = new HashMap<String, String>();

        if (httpServletRequest.getQueryString() != null) {
            String[] params = httpServletRequest.getQueryString().split("&");
            for (String param : params) {
                String[] subParam = param.split("=");
                paramsMap.put(subParam[0], subParam[1]);
            }
        }

        String authTokenStr = null;
        Cookie[] cookies = httpServletRequest.getCookies();
        for (int n = 0; n < cookies.length; n++) {
            Cookie cookie = cookies[n];

            if (cookie.getName().equals("ZM_AUTH_TOKEN")) {
                authTokenStr = cookie.getValue();
                break;
            }
        }

        Account account = null;

        if (authTokenStr != null) {
            try {
                AuthToken authToken = AuthToken.getAuthToken(authTokenStr);
                account = mProvisioning.assertAccountById(authToken.getAccountId());

            } catch (AuthTokenException ex) {
                throw new RuntimeException(ex);
            }

            final Map<String, String> userProperties = UserPropertyExtractor.getZimletUserProperties(account, Zimlet.NAME);

            if (
                    userProperties.get(ZimletProperty.DAV_SERVER_NAME) == null ||
                            userProperties.get(ZimletProperty.DAV_SERVER_PORT) == null ||
                            userProperties.get(ZimletProperty.DAV_SERVER_PATH) == null ||
                            userProperties.get(ZimletProperty.DAV_USER_USERNAME) == null
                    ) {
                throw new RuntimeException("DAV Data connection not set for user '" + account.getName() + "'");
            }

            {
                final URL serverUrl;
                try {
                    serverUrl = new URL(userProperties.get(ZimletProperty.DAV_SERVER_NAME));
                } catch (MalformedURLException e) {
                    throw new RuntimeException(e);
                }
                if (!UserPropertyExtractor.checkPermissionOnTarget(serverUrl, account)) {
                    throw new RuntimeException("Proxy domain not allowed '" + serverUrl + "' for user '" + account.getName() + "'");
                }
            }

            ServletFileUpload upload = new ServletFileUpload(new DiskFileItemFactory());
            //hard coded upload limiit to 1GB
            upload.setSizeMax(1048576000);
            upload.setFileSizeMax(1048576000);
            try {
                List<FileItem> items = upload.parseRequest(httpServletRequest);
                List<String> fileNames = new ArrayList<String>();

                String reqId = "";
                String password = "";

                for (FileItem item : items) {
                    if (item.isFormField()) {
                        if (item.getFieldName().equals("password")) {
                            // correlate this file upload session's request and response
                            password = item.getString();
                        }
                    }
                }

                final DavSoapConnector connector = new DavSoapConnector(
                        userProperties.get(ZimletProperty.DAV_SERVER_NAME),
                        Integer.parseInt(userProperties.get(ZimletProperty.DAV_SERVER_PORT)),
                        userProperties.get(ZimletProperty.DAV_SERVER_PATH),
                        userProperties.get(ZimletProperty.DAV_USER_USERNAME),
                        password
                );


                for (FileItem item : items) {
                    if (item.isFormField()) {
                        if (item.getFieldName().equals("requestId")) {
                            // correlate this file upload session's request and response
                            reqId = item.getString();
                        }
                    }

                    if (item.getName() == null) {
                        continue;
                    }

                    //to-do implement proper encoding and better sanitizing (allow more characters)
                    String fileNameString = getFileName(item.getName().replaceAll("\\\\|\\/|\\:|\\*|\\?|\\\"|\\<|\\>|\\||\\%|\\&|\\@|\\!|\\'|\\[|\\]", "").replace(" ", "%20"), userProperties.get(ZimletProperty.USE_NUMBERS));

                    fileNames.add(fileNameString);

                    /* connector.put does not work when the dav server is on a non-standard port
                    sardine org.apache.http.client.NonRepeatableRequestException
                    https://github.com/lookfirst/sardine/issues/132
                    maybe enablePreemptiveAuthentication fails on non standard port?
                    Anyway, adding a work around for such use cases
                    */

                    if ("80".equals(userProperties.get(ZimletProperty.DAV_SERVER_PORT)) || "443".equals(userProperties.get(ZimletProperty.DAV_SERVER_PORT))) {
                        connector.put(
                                paramsMap.get("path") + fileNameString,
                                item.getInputStream()
                        );
                    } else {

                        /*
                        * Apache HttpPut.
                        *
                        * @author javaQuery
                        * @date 26th January, 2016
                        * @Github: https://github.com/javaquery/Examples
                        */
                        /* Create object of CloseableHttpClient */
                        CloseableHttpClient httpClient = HttpClients.createDefault();

                        /* Prepare put request */
                        String username = userProperties.get(ZimletProperty.DAV_USER_USERNAME);
                        String path = paramsMap.get("path");
                        if ("/".equals(path)) {
                            path = userProperties.get(ZimletProperty.DAV_SERVER_PATH);
                        }
                        //to-do here it would be better to implement more encoding to the url to avoid URISyntaxException, however this is harder than it seems, as we must separate host/port and location parts
                        //for now just deal with spaces only.
                        String url = userProperties.get(ZimletProperty.DAV_SERVER_NAME) + ":" + Integer.parseInt(userProperties.get(ZimletProperty.DAV_SERVER_PORT)) + path + fileNameString.replace(" ", "%20");
                        HttpPut httpPut = new HttpPut(url);

                        /* Add headers to get request */
                        byte[] credentials = Base64.encodeBase64((uriDecode(username) + ":" + uriDecode(password)).getBytes());

                        httpPut.addHeader("Authorization", "Basic " + new String(credentials));
                        /* Prepare StringEntity from inputStream */
                        InputStream inputStream = item.getInputStream();
                        InputStreamEntity Entity = new InputStreamEntity(inputStream);
                        /* Body of request */
                        httpPut.setEntity(Entity);

                        /* Response handler for after request execution */
                        ResponseHandler<String> responseHandler = new ResponseHandler<String>() {

                            @Override
                            public String handleResponse(HttpResponse httpResponse) throws ClientProtocolException, IOException {
                            /* Get status code */
                                int httpResponseCode = httpResponse.getStatusLine().getStatusCode();
                                //System.out.println("Response code: " + httpResponseCode);
                                if (httpResponseCode >= 200 && httpResponseCode < 300) {
                                /* Convert response to String */
                                    HttpEntity entity = httpResponse.getEntity();
                                    return entity != null ? EntityUtils.toString(entity) : null;
                                } else {
                                    return null;
                                /* throw new ClientProtocolException("Unexpected response status: " + httpResponseCode); */
                                }
                            }
                        };

                        try {
                        /* Execute URL and attach after execution response handler */
                            String strResponse = httpClient.execute(httpPut, responseHandler);
                        /* Print the response */
                            //System.out.println("Response: " + strResponse);
                        } catch (IOException ex) {
                            ex.printStackTrace();
                        }
                    }
                }

                StringBuilder sb = new StringBuilder();
                sb.append("[");
                boolean isFirst = true;
                for (String fileName : fileNames) {
                    if (isFirst) {
                        isFirst = false;
                    } else {
                        sb.append(",");
                    }
                    sb.append(fileName);
                }
                sb.append("]");

                OutputStream outuputStream = httpServletResponse.getOutputStream();
                outuputStream.write(
                        ("<html><head><script language='javascript'>\n" +
                                "function doit() { window.parent._uploadManager.loaded(200, '" + reqId + "', '" + sb.toString() + "'); }\n" +
                                "</script></head><body onload='doit()'></body></html>").getBytes()
                );
                outuputStream.flush();
            } catch (FileUploadException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private String uriDecode(String dirty) {
        try {
            String clean = java.net.URLDecoder.decode(dirty, "UTF-8");
            return clean;
        } catch (Exception ex) {
            return ex.toString();
        }
    }

    private String getFileName(String filename, String numberedFilenames) {
        try {
            FileInputStream input = new FileInputStream("/opt/zimbra/lib/ext/ownCloud/config.properties");
            Properties prop = new Properties();
            prop.load(input);
            input.close();
            String fileNumberStr = prop.getProperty("file_number");


            if ("true".equals(numberedFilenames)) {
                int fileNumber = Integer.parseInt(fileNumberStr);

                fileNumber = fileNumber + 1;

                FileOutputStream out = new FileOutputStream("/opt/zimbra/lib/ext/ownCloud/config.properties");
                prop.setProperty("file_number", Integer.toString(fileNumber));
                prop.store(out, "Updated file_number via getFileName.");
                out.close();


                if (filename.lastIndexOf(".") > -1) {
                    filename = fileNumberStr + filename.substring(filename.lastIndexOf("."));
                } else {
                    filename = fileNumberStr;
                }

            }
            return filename;

        } catch (IOException ex) {
            ex.printStackTrace();

            return filename;
        }
    }

    @Override
    public void doOptions(
            HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse
    )
            throws ServletException, IOException {
    }

    @Override
    public String getPath() {
        return "dav_upload";
    }
}
