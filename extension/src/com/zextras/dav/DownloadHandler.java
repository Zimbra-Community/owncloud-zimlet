package com.zextras.dav;

import org.openzal.zal.http.HttpHandler;
import org.openzal.zal.Provisioning;
import org.openzal.zal.Account;
import org.openzal.zal.Server;
import org.openzal.zal.extension.Zimbra;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.HttpResponse;
import java.io.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.*;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;


public class DownloadHandler implements HttpHandler {
    private final Map<String, DownloadJob> mDownloadJobMap;
    private final Zimbra mZimbra;
    private Provisioning mProvisioning;

    public DownloadHandler(Map<String, DownloadJob> downloadJobMap) {
        mDownloadJobMap = downloadJobMap;
        mZimbra = new Zimbra();
        mProvisioning = mZimbra.getProvisioning();
    }

    @Override
    public void doGet(
            HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse
    )
            throws ServletException, IOException {
        Map<String, String> paramsMap = new HashMap<String, String>();

        String[] params = httpServletRequest.getQueryString().split("&");
        String query = httpServletRequest.getQueryString();
        for (String param : params) {
            String[] subParam = param.split("=");
            paramsMap.put(subParam[0], subParam[1]);
        }
        String token = paramsMap.get("token");
        String inline = paramsMap.get("inline");
        String accountStr = "";
        boolean isLocalAccount = false;
        accountStr = paramsMap.get("account");
        Account account = null;
        if ((accountStr == "") || (accountStr == null)) {
            isLocalAccount = true;
        } else {
            account = mProvisioning.assertAccountByName(accountStr);
            isLocalAccount = account.isLocalAccount();
        }

        if (!(isLocalAccount)) {
            redirectGETRequestToRemoteServer(account,query,httpServletResponse);
        } else {
            if (mDownloadJobMap.containsKey(token)) {
                DownloadJob job = mDownloadJobMap.get(token);
                if (!job.expired()) {

                    DavSoapConnector connector = job.getConnector();
                    InputStream fileStream = connector.getAsStream(job.getPath());
                    OutputStream outputStream = httpServletResponse.getOutputStream();

                    String extension;
                    extension = "false";
                    switch (paramsMap.get("contentType")) {
                        case "application/msword":
                            extension = "doc";
                            break;
                        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                            extension = "docx";
                            break;
                        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                            extension = "xlsx";
                            break;
                        case "application/vnd.ms-excel":
                            extension = "xls";
                            break;
                        case "application/vnd.ms-powerpoint":
                            extension = "ppt";
                            break;
                        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                            extension = "pptx";
                            break;
                        case "application/vnd.oasis.opendocument.spreadsheet":
                            extension = "ods";
                            break;
                        case "application/vnd.oasis.opendocument.presentation":
                            extension = "odp";
                            break;
                        case "application/vnd.oasis.opendocument.text":
                            extension = "odt";
                            break;
                        case "image/vnd.djvu":
                            extension = "djvu";
                            break;
                    }

                    if (("true".equals(inline)) && (!"false".equals(extension))) {
                        //Check if conversion is available
                        File f = new File("/usr/local/sbin/docconvert");
                        if (f.exists()) {

                            //Convert to PDF
                            //Create a temporary filename
                            String tmpFileName = "/tmp/docconvert" + UUID.randomUUID().toString();

                            byte[] buffer = new byte[8 * 1024];

                            try {
                                OutputStream output = new FileOutputStream(tmpFileName + "." + extension);
                                try {
                                    int bytesRead;
                                    while ((bytesRead = fileStream.read(buffer)) != -1) {
                                        output.write(buffer, 0, bytesRead);
                                    }
                                } finally {
                                    output.close();
                                }
                            } finally {
                                fileStream.close();
                            }

                            try {
                                if ("djvu".equals(extension)) {
                                    this.runCommand("/usr/local/sbin/zimbra-djvu2pdf " + tmpFileName + "." + extension);
                                } else {
                                    this.runCommand("/usr/local/sbin/docconvert " + tmpFileName + "." + extension);
                                }
                                httpServletResponse.addHeader("Content-Type", "application/pdf");
                                httpServletResponse.addHeader("Content-Disposition", "attachment; filename=\"" + paramsMap.get("name") + ".pdf\"");
                                httpServletResponse.addHeader("Accept-Ranges", "none");

                                FileInputStream in = new FileInputStream(tmpFileName + ".pdf");

                                // Copy the contents of the file to the output stream
                                byte[] buf = new byte[1024];
                                int count = 0;
                                while ((count = in.read(buf)) >= 0) {
                                    outputStream.write(buf, 0, count);
                                }
                                outputStream.close();
                                in.close();
                            } finally {
                                outputStream.close();
                            }
                            try {
                                File fileorig = new File(tmpFileName + "." + extension);
                                fileorig.delete();
                                this.runCommand("/usr/local/sbin/docconvertclean " + tmpFileName + ".*");
                            } catch (Exception x) {

                            }
                        }
                    } else {
                        if (paramsMap.containsKey("contentType")) {
                            httpServletResponse.addHeader("Content-Type", paramsMap.get("contentType"));
                        }

                        if (!"true".equals(inline)) {
                            httpServletResponse.addHeader("Content-Disposition", "attachment; filename=\"" + paramsMap.get("name") + "\"");
                        } else {
                            httpServletResponse.addHeader("Content-Disposition", "inline; filename=\"" + paramsMap.get("name") + "\"");
                            httpServletResponse.addHeader("Accept-Ranges", "none");
                        }

                        byte[] buffer = new byte[64 * 1024];
                        int quantity;
                        try {
                            while (true) {
                                quantity = fileStream.read(buffer);
                                if (quantity <= 0) break;
                                outputStream.write(buffer, 0, quantity);
                            }
                        } finally {
                            mDownloadJobMap.remove(job.getToken());
                            outputStream.flush();
                            fileStream.close();
                        }
                    }
                }
            }
        }
    }

    private String runCommand(String cmd) {
        try {
            Runtime rt = Runtime.getRuntime();
            Process pr = rt.exec(cmd);
            BufferedReader cmdOutputBuffer = new BufferedReader(new InputStreamReader(pr.getInputStream()));

            StringBuilder builder = new StringBuilder();
            String aux = "";
            while ((aux = cmdOutputBuffer.readLine()) != null) {
                builder.append(aux);
                builder.append(';');
            }
            String cmdResult = builder.toString();
            return cmdResult;

        } catch (IOException e) {
            {
                return "IOException in dav_download/runCommand";
            }
        }
    }

    @Override
    public void doPost(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse)
            throws ServletException, IOException {
        //This is used in the zimlet to determine if conversion if available, see OwnCloudListView.js
        File f = new File("/usr/local/sbin/docconvert");
        if (f.exists()) {
            httpServletResponse.getOutputStream().print("true");
        } else {
            httpServletResponse.getOutputStream().print("false");
        }

        httpServletResponse.getOutputStream().print(";");

        //This is used to generate Only Office security token, if configured, see onlyOfficeParams in OwnCloudListView.js
        Properties prop = new Properties();
        try {
            FileInputStream input = new FileInputStream("/opt/zimbra/lib/ext/ownCloud/config.properties");
            prop.load(input);
            String owncloud_zimlet_onlyoffice_secret = prop.getProperty("owncloud_zimlet_onlyoffice_secret");
            input.close();

            if (owncloud_zimlet_onlyoffice_secret != null && !owncloud_zimlet_onlyoffice_secret.isEmpty()) {
                try {
                    Algorithm algorithm = Algorithm.HMAC256(owncloud_zimlet_onlyoffice_secret);
                    String token = JWT.create()
                            .withIssuer("auth0")
                            .sign(algorithm);
                    httpServletResponse.getOutputStream().print(token);
                } catch (UnsupportedEncodingException exception) {
                    //UTF-8 encoding not supported
                } catch (JWTCreationException exception) {
                    //Invalid Signing configuration / Couldn't convert Claims.
                }
            }

        } catch (IOException ex) {
        }


    }

    @Override
    public void doOptions(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse)
            throws ServletException, IOException {
    }

    @Override
    public String getPath() {
        return "dav_download";
    }

    /** This function was inspired from redirectRequestToRemoteServer function
    * which can be found at:
    * zimbra-extension/src/com/zextras/zimbradrive/NcUserZimbraBackendHttpHandler.java
    * file from ZimbraDrive extension.
    *
    * It was rewritten to forward a GET request instead of a POST request to a remote server.
    * It makes sure to use the proper server public serviceurl so that the GET request reaches
    * the remote mailbox server.
    **/
    private void redirectGETRequestToRemoteServer(
        Account account,
        String query,
        HttpServletResponse httpServletResponse)
        throws IOException
    {

        Server remoteServer = mProvisioning.getServerByName(account.getMailHost());
        String davDownloadUrl = remoteServer.getServiceURL("/service/extension/" + getPath() + "/?" + query);

        HttpGet get = new HttpGet(davDownloadUrl);

        HttpClient client = HttpClientBuilder.create().build();
        HttpResponse response = client.execute(get);
        try (OutputStream responseOutputStream = httpServletResponse.getOutputStream())
        {
            response.getEntity().writeTo(responseOutputStream);
        }

    }


}
