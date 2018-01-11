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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.Properties;

import java.net.HttpURLConnection;

import org.apache.commons.io.IOUtils;

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

        String originatingIP;
        if (UserPropertyExtractor.checkZimbraMailTrustedIP(httpServletRequest.getRemoteAddr())) {
            //This is a trusted IP try and read x-forwarded-for, fall back to getRemoteAddr
            originatingIP = httpServletRequest.getHeader("X-FORWARDED-FOR");
            if (originatingIP == null) {
                originatingIP = httpServletRequest.getRemoteAddr();
            }
        } else {
            //it is not trusted so we do not read the header
            originatingIP = httpServletRequest.getRemoteAddr();
        }

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

                    /* Prepare put request */
                    String username = userProperties.get(ZimletProperty.DAV_USER_USERNAME);
                    String path = paramsMap.get("path");
                    if ("/".equals(path)) {
                        path = userProperties.get(ZimletProperty.DAV_SERVER_PATH);
                    }

                    /* Add headers to get request */
                    byte[] credentials = Base64.encodeBase64((uriDecode(username) + ":" + uriDecode(password)).getBytes());

                    InputStream inputStream = null;
                    OutputStream out = null;
                    try {
                        URL url = new URL(userProperties.get(ZimletProperty.DAV_SERVER_NAME) + ":" + Integer.parseInt(userProperties.get(ZimletProperty.DAV_SERVER_PORT)) + path + fileNameString.replace(" ", "%20"));
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setDoOutput(true);
                        conn.setRequestProperty("X-Forwarded-For", originatingIP);
                        conn.setRequestProperty("Authorization", "Basic " + new String(credentials));
                        conn.setRequestMethod("PUT");

                        inputStream = item.getInputStream();
                        byte fileContent[] = IOUtils.toByteArray(inputStream);
                        inputStream.read(fileContent);
                        out = conn.getOutputStream();
                        out.write(fileContent);
                        out.close();
                        conn.getInputStream();
                    } catch (
                            Exception e) {
                        e.printStackTrace();
                    } finally {
                        // close the streams using close method
                        try {
                            if (inputStream != null) {
                                inputStream.close();
                            }
                            if (out != null) {
                                out.close();
                            }
                        } catch (IOException ioe) {
                            System.out.println("Error while closing stream: " + ioe);
                        }
                    }

                    try {
                    } catch (Exception ex) {
                        ex.printStackTrace();
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
