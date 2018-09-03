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

*/

package tk.barrydegraaff.onlyoffice;


import com.zimbra.cs.extension.ExtensionHttpHandler;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.*;

import java.net.URL;
import java.util.*;


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
        /*There is no user authentication in this back-end as the OnlyOffice document server
         * is calling this endpoint, and that does not have any credentials other than the `key` parameter.*/
        try {
            PrintWriter writer = resp.getWriter();

            Scanner scanner = new Scanner(req.getInputStream()).useDelimiter("\\A");
            String body = scanner.hasNext() ? scanner.next() : "";

            JSONObject jsonObj = (JSONObject) new JSONParser().parse(body);

            if ((long) jsonObj.get("status") == 2) {
                String downloadUri = (String) jsonObj.get("url");

                URL url = new URL(downloadUri);
                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                InputStream stream = connection.getInputStream();

                File savedFile = new File("/tmp/test.docx");
                try (FileOutputStream out = new FileOutputStream(savedFile)) {
                    int read;
                    final byte[] bytes = new byte[1024];
                    while ((read = stream.read(bytes)) != -1) {
                        out.write(bytes, 0, read);
                    }

                    out.flush();
                }

                connection.disconnect();
            }
            writer.write("{\"error\":0}");

        } catch (Exception err) {
            responseWriter("error", resp, null);
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

}
