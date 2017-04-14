/*

Copyright (C) 2016  Barry de Graaff

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


usage: POST file to https://myzimbra.com/service/extension/docconvert/?extension=docx&name=title.docx
returns a PDF
*/

package tk.barrydegraaff.docconvert;


import com.zimbra.cs.extension.ExtensionHttpHandler;
import com.zimbra.common.service.ServiceException;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.FileInputStream;
import java.io.OutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.File;
import java.io.IOException;

import com.zimbra.common.util.ZimbraLog;
import com.zimbra.common.util.SystemUtil;
import com.zimbra.cs.account.AuthToken;
import com.zimbra.cs.account.AuthTokenException;

import java.util.HashMap;
import java.util.List;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import com.zimbra.cs.account.Provisioning;
import com.zimbra.cs.account.Account;
import com.zimbra.cs.account.Cos;

import java.util.Set;

public class DocConvert extends ExtensionHttpHandler {

    /**
     * The path under which the handler is registered for an extension.
     *
     * @return path
     */
    @Override
    public String getPath() {
        return "/docconvert";
    }

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
        resp.getOutputStream().print("tk.barrydegraaff.docconvert is installed. HTTP GET method is not supported");
    }

    /**
     * Processes HTTP POST requests.
     *
     * @param req  request message
     * @param resp response message
     * @throws java.io.IOException
     * @throws javax.servlet.ServletException
     */
    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        String authTokenStr = null;
        //Just read a cos value to see if its a valid user
        Cookie[] cookies = req.getCookies();
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
                Provisioning prov = Provisioning.getInstance();
                Account acct = Provisioning.getInstance().getAccountById(authToken.getAccountId());
                Cos cos = prov.getCOS(acct);
                Set<String> allowedDomains = cos.getMultiAttrSet(Provisioning.A_zimbraProxyAllowedDomains);
            } catch (Exception ex) {
                //crafted cookie? get out you.
                return;
            }
        } else {
            return;
        }
        final Map<String, String> paramsMap = new HashMap<String, String>();

        if (req.getQueryString() != null) {
            String[] params = req.getQueryString().split("&");
            for (String param : params) {
                String[] subParam = param.split("=");
                paramsMap.put(subParam[0], subParam[1]);
            }
        } else {
            //do nothing
            return;
        }
        String extension;
        switch (paramsMap.get("extension")) {
            case "doc":
            case "docx":
            case "xlsx":
            case "xls":
            case "ppt":
            case "pptx":
            case "ods":
            case "odp":
            case "odt":
                //continue with conversion, avoided use of regex for security audit reasons
                extension = paramsMap.get("extension");
                break;
            default:
                //do nothing
                return;
        }
        //Create a temporary filename
        String tmpFileName = "/tmp/docconvert" + UUID.randomUUID().toString();

        File file;
        try {
            ServletFileUpload upload = new ServletFileUpload(new DiskFileItemFactory());
            //hard coded upload limiit to 1GB
            upload.setSizeMax(1048576000);
            upload.setFileSizeMax(1048576000);
            try {

                List fileItems = upload.parseRequest(req);
                Iterator i = fileItems.iterator();
                while (i.hasNext()) {
                    FileItem fi = (FileItem) i.next();
                    if (!fi.isFormField()) {

                        file = new File(tmpFileName + "." + extension);

                        fi.write(file);

                        this.runCommand("/usr/local/sbin/docconvert " + tmpFileName + "." + extension);

                        resp.addHeader("Content-Type", "application/pdf");
                        resp.addHeader("Content-Disposition", "attachment; filename=\"" + paramsMap.get("name") + ".pdf\"");
                        resp.addHeader("Accept-Ranges", "none");

                        FileInputStream in = new FileInputStream(tmpFileName + ".pdf");
                        OutputStream out = resp.getOutputStream();

                        // Copy the contents of the file to the output stream
                        byte[] buf = new byte[1024];
                        int count = 0;
                        while ((count = in.read(buf)) >= 0) {
                            out.write(buf, 0, count);
                        }
                        out.close();
                        in.close();

                        try {
                            File fileorig = new File(tmpFileName + "." + extension);
                            fileorig.delete();
                            this.runCommand("/usr/local/sbin/docconvertclean " + tmpFileName + ".*");
                        } catch (Exception x) {

                        }

                    }
                }
            } catch (Exception e) {
                ZimbraLog.extensions.error(SystemUtil.getStackTrace(e));
                throw new IOException(e);
            }
        } catch (Exception e) {
            ZimbraLog.extensions.error(SystemUtil.getStackTrace(e));
            throw new IOException(e);
        }
    }

    private String runCommand(String cmd) throws ServiceException {
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

        } catch (
                Exception e)

        {
            throw ServiceException.FAILURE("ShareToolkitSoapHandler runCommand exception", e);
        }
    }
}