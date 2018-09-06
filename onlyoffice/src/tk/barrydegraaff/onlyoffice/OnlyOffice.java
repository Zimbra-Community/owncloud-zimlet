/*
Copyright (C) 2018  Barry de Graaff

Bugs and feedback: https://github.com/Zimbra-Community/owncloud-zimlet/issues

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.

The callbacl url for OnlyOffice should be define to:
https://zimbradev/service/extension/onlyoffice
See also:https://api.onlyoffice.com/editors/save
* https://api.onlyoffice.com/editors/callback

*/

package tk.barrydegraaff.onlyoffice;


import com.zimbra.cs.account.Account;
import com.zimbra.cs.account.AuthToken;
import com.zimbra.cs.account.Cos;
import com.zimbra.cs.account.Provisioning;
import com.zimbra.cs.extension.ExtensionHttpHandler;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.bind.DatatypeConverter;

import java.io.*;

import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.*;
import java.util.*;

import org.apache.commons.io.IOUtils;
import org.apache.commons.codec.binary.Base64;

public class OnlyOffice extends ExtensionHttpHandler {

    /**
     * The path under which the handler is registered for an extension.
     *
     * @return path
     */
    @Override
    public String getPath() {
        return "/onlyoffice";
    }

    private String DbConnectionString;
    private String EncryptionPassword;
    private String EncryptionSalt;

    /**
     * Processes HTTP GET requests.
     *
     * @param req  request message
     * @param resp response message
     * @throws java.io.IOException
     * @throws javax.servlet.ServletException
     */
    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        resp.getOutputStream().print("tk.barrydegraaff.onlyoffice is installed. HTTP GET method is not supported");
    }

    /**
     * Processes HTTP POST requests.
     *
     * @param req  request message
     * @param resp response message
     * @throws java.io.IOException
     * @throws javax.servlet.ServletException See also: https://api.onlyoffice.com/editors/callback
     */
    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {

        try {
            if (!this.setProperties()) {
                //failed to read props file
                return;
            }
            final Map<String, String> paramsMap = new HashMap<String, String>();

            if (req.getParameter("filekey") != null) {

                /*Make sure the user is authenticated*/
                String authTokenStr = null;
                Account zimbraAccount = null;
                //Just read a cos value to see if its a valid user
                try {
                    Cookie[] cookies = req.getCookies();
                    for (int n = 0; n < cookies.length; n++) {
                        Cookie cookie = cookies[n];

                        if (cookie.getName().equals("ZM_AUTH_TOKEN")) {
                            authTokenStr = cookie.getValue();
                            break;
                        }
                    }

                    if (authTokenStr != null) {
                        AuthToken authToken = AuthToken.getAuthToken(authTokenStr);
                        Provisioning prov = Provisioning.getInstance();
                        zimbraAccount = Provisioning.getInstance().getAccountById(authToken.getAccountId());
                        Cos cos = prov.getCOS(zimbraAccount);
                        Set<String> allowedDomains = cos.getMultiAttrSet(Provisioning.A_zimbraProxyAllowedDomains);
                    } else {
                        responseWriter("unauthorized", resp, null);
                        return;
                    }

                } catch (Exception ex) {
                    //crafted cookie? get out you.
                    responseWriter("unauthorized", resp, null);
                    return;
                }

                try {
                    String db_connect_string = this.DbConnectionString;
                    Connection connection = DriverManager.getConnection(db_connect_string);
                    String cryptedPassword = Encrypt(req.getParameter("owncloud_zimlet_password") + this.EncryptionSalt, this.EncryptionPassword);

                    if (!connection.isClosed()) {
                        PreparedStatement stmt = connection.prepareStatement("REPLACE INTO files VALUES (?,?,?,?,?,?,?,?,NOW())");
                        //Perhaps we should wrap uriDecode() around the parameters to decode them? Seems Java already did at this point
                        stmt.setString(1, req.getParameter("filekey"));
                        stmt.setString(2, req.getParameter("path"));
                        stmt.setString(3, req.getParameter("owncloud_zimlet_server_path"));
                        stmt.setString(4, cryptedPassword);
                        stmt.setString(5, req.getParameter("owncloud_zimlet_username"));
                        stmt.setString(6, req.getParameter("owncloud_zimlet_server_name"));
                        stmt.setString(7, req.getParameter("owncloud_zimlet_server_port"));
                        stmt.setString(8, req.getParameter("owncloud_zimlet_oc_folder"));
                        stmt.executeQuery();
                    }
                    connection.close();

                } catch (Exception e) {
                    e.printStackTrace();
                    responseWriter("error", resp, null);
                }

            } else {

                /*There is no user authentication in this back-end as the OnlyOffice document server
                 * is calling this endpoint, and that does not have any credentials other than the `key` parameter.*/

                //make sure we have a working db connection, if it fails, the extension will not report {error:0} causing OnlyOffice
                //to warn the user that saving is not available.

                String db_connect_string = this.DbConnectionString;
                Connection dbconnection = DriverManager.getConnection(db_connect_string);

                if (!dbconnection.isClosed()) {
                    PrintWriter writer = resp.getWriter();

                    Scanner scanner = new Scanner(req.getInputStream()).useDelimiter("\\A");
                    String body = scanner.hasNext() ? scanner.next() : "";

                    JSONObject jsonObj = (JSONObject) new JSONParser().parse(body);

                    if ((long) jsonObj.get("status") == 2) {
                        String downloadUri = (String) jsonObj.get("url");

                        URL url = new URL(downloadUri);
                        java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                        InputStream stream = connection.getInputStream();

                        //This would store the edited file locally for debug
                        /*
                        File savedFile = new File("/tmp/test.docx");
                        try (FileOutputStream out = new FileOutputStream(savedFile)) {
                            int read;
                            final byte[] bytes = new byte[1024];
                            while ((read = stream.read(bytes)) != -1) {
                                out.write(bytes, 0, read);
                            }
                            out.flush();
                        }
                        */

                        //X-FORWARDED-FOR is being passed on to the DAV server, or the originating IP based on the configuration to fight DDOS
                        String originatingIP;
                        if (checkZimbraMailTrustedIP(req.getRemoteAddr())) {
                            //This is a trusted IP try and read x-forwarded-for, fall back to getRemoteAddr
                            originatingIP = req.getHeader("X-FORWARDED-FOR");
                            if (originatingIP == null) {
                                originatingIP = req.getRemoteAddr();
                            }
                        } else {
                            //it is not trusted so we do not read the header
                            originatingIP = req.getRemoteAddr();
                        }


                        String key = (String) jsonObj.get("key");

                        PreparedStatement stmt = dbconnection.prepareStatement("SELECT * FROM files WHERE filekey = ?");
                        stmt.setString(1, key);
                        ResultSet editingSession = stmt.executeQuery();

                        while (editingSession.next()) {

                            String decryptedPassword = Decrypt(editingSession.getString("owncloud_zimlet_password"), this.EncryptionPassword);
                            decryptedPassword = decryptedPassword.replace(this.EncryptionSalt, "");
                            byte[] credentials = Base64.encodeBase64((editingSession.getString("owncloud_zimlet_username") + ":" + decryptedPassword).getBytes());
                            OutputStream out = null;
                            try {
                                //to-do: verify if we need to encode path more than %20
                                URL davurl = new URL(editingSession.getString("owncloud_zimlet_server_name") + ":" + Integer.parseInt(editingSession.getString("owncloud_zimlet_server_port")) + editingSession.getString("path").replace(" ", "%20"));
                                HttpURLConnection conn = (HttpURLConnection) davurl.openConnection();
                                conn.setDoOutput(true);
                                conn.setRequestProperty("X-Forwarded-For", originatingIP);
                                conn.setRequestProperty("Authorization", "Basic " + new String(credentials));
                                conn.setRequestMethod("PUT");


                                byte fileContent[] = IOUtils.toByteArray(stream);
                                stream.read(fileContent);
                                out = conn.getOutputStream();
                                out.write(fileContent);
                                out.close();
                                conn.getInputStream();

                                //clean out this record
                                stmt = dbconnection.prepareStatement("DELETE from files WHERE filekey = ? OR TIME_TO_SEC(created) > 86400");
                                stmt.setString(1, key);
                                stmt.executeUpdate();

                            } catch (
                                    Exception e) {
                                e.printStackTrace();
                            } finally {
                                // close the streams using close method
                                try {
                                    if (stream != null) {
                                        stream.close();
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
                        editingSession.close();


                        connection.disconnect();
                    }
                    writer.write("{\"error\":0}");
                    dbconnection.close();
                }
            }
        } catch (
                Exception e) {
            e.printStackTrace();
            responseWriter("error", resp, null);
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

    /**
     * There has to be a better way to get the contents of zimbraMailTrustedIP but
     * haven't found it yet. So for now we put it in trustedIPs.properties and have the
     * installer update it.
     */
    public static boolean checkZimbraMailTrustedIP(String ip) {

        Properties prop = new Properties();
        try {
            FileInputStream input = new FileInputStream("/opt/zimbra/lib/ext/ownCloud/trustedIPs.properties");
            prop.load(input);

            String[] temp = prop.getProperty("zimbramailtrustedips").split(";");
            Set<String> zimbramailtrustedips = new HashSet<String>(Arrays.asList(temp));

            input.close();

            for (String zimbramailtrustedip : zimbramailtrustedips) {
                if (ip.equals(zimbramailtrustedip)) {
                    return true;
                }
            }
            return false;
        } catch (Exception ex) {
            return false;
        }
    }

    private void responseWriter(String action, HttpServletResponse resp, String message) {
        try {
            switch (action) {
                case "ok":
                    resp.setStatus(HttpServletResponse.SC_OK);
                    if (message == null) {
                        resp.getWriter().write("OK");
                    } else {
                        resp.getWriter().write(message);
                    }
                    break;
                case "unauthorized":
                    resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    resp.getWriter().write("Not authorized.");
                    break;
                case "error":
                    resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    resp.getWriter().write("The request did not succeed successfully.");
                    break;
            }
            resp.getWriter().flush();
            resp.getWriter().close();
        } catch (Exception e) {
        }
    }

    private boolean setProperties() {
        Properties prop = new Properties();
        try {
            FileInputStream input = new FileInputStream("/opt/zimbra/lib/ext/ownCloud/config.properties");
            prop.load(input);
            input.close();
            this.DbConnectionString = prop.getProperty("db_connect_string");
            this.EncryptionPassword = prop.getProperty("encryption_password_secret");
            this.EncryptionSalt = prop.getProperty("encryption_salt_secret");
            return true;
        } catch (IOException ex) {
            ex.printStackTrace();
            return false;
        }
    }

    public String Encrypt(String Input, String key) {

        try {

            SecretKeySpec aesKey = new SecretKeySpec(key.getBytes(), "AES");
            Cipher cipher = Cipher.getInstance("AES");

            cipher.init(Cipher.ENCRYPT_MODE, aesKey);
            byte[] encrypted = cipher.doFinal(Input.getBytes());
            return DatatypeConverter.printBase64Binary(encrypted);

        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    public String Decrypt(String Input, String key) {

        try {


            SecretKeySpec aesKey = new SecretKeySpec(key.getBytes(), "AES");
            Cipher cipher = Cipher.getInstance("AES");

            cipher.init(Cipher.DECRYPT_MODE, aesKey);
            return new String(cipher.doFinal(DatatypeConverter.parseBase64Binary(Input)));

        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }


}
