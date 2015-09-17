/*
    davclient.js - Low-level JavaScript WebDAV client implementation
    
    Supports following methods: MKCOL, MOVE, GET, DELETE, COPY, PUT, PROPFIND

    Copyright (C) Sven vogler
    email s.vogler@gmx.de

	Inspired by implementation of Guido Wesdorp
	http://debris.demon.nl/projects/davclient.js/
	
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

*/

var global = this;

global.string = new function() {
    var string = this;

    this.strip = function strip(s) {
        /* returns a string with all leading and trailing whitespace removed */
        var stripspace = /^\s*([\s\S]*?)\s*$/;
        return stripspace.exec(s)[1];
    };
    
    this.deentitize = function deentitize(s) {
        /* convert all standard XML entities to the corresponding characters */
        // first numbered entities
        var numberedreg = /&#(x?)([a-f0-9]{2,});/ig;
        while (true) {
            var match = numberedreg.exec(s);
            if (!match) {
                break;
            };
            var value = match[2];
            var base = 10;
            if (match[1]) {
                base = 16;
            };
            value = String.fromCharCode(parseInt(value, base));
            s = s.replace(new RegExp(match[0], 'g'), value);
        };
        // and standard ones
        s = s.replace(/&gt;/g, '>');
        s = s.replace(/&lt;/g, '<');
        s = s.replace(/&apos;/g, "'");
        s = s.replace(/&quot;/g, '"');
        s = s.replace(/&amp;/g, '&');
        s = s.replace(/&nbsp;/g, "");
        
        // remove the xml declaration as E4X cannot parse it
        s = s.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "");
        
        return s;
    };  
    

    this.encodeBase64 = function encodeBase64(input) {
    	return base64.encode(input);
    }

    var base64 = {
    		// private property
    		_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    		// public method for encoding
    		encode : function (input) {
    		    var output = "";
    		    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    		    var i = 0;

    		    input = base64._utf8_encode(input);

    		    while (i < input.length) {

    		        chr1 = input.charCodeAt(i++);
    		        chr2 = input.charCodeAt(i++);
    		        chr3 = input.charCodeAt(i++);

    		        enc1 = chr1 >> 2;
    		        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    		        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    		        enc4 = chr3 & 63;

    		        if (isNaN(chr2)) {
    		            enc3 = enc4 = 64;
    		        } else if (isNaN(chr3)) {
    		            enc4 = 64;
    		        }

    		        output = output +
    		        base64._keyStr.charAt(enc1) + base64._keyStr.charAt(enc2) +
    		        base64._keyStr.charAt(enc3) + base64._keyStr.charAt(enc4);

    		    }

    		    return output;
    		},
    		

    		// private method for UTF-8 encoding
    		_utf8_encode : function (string) {
    		    string = string.replace(/\r\n/g,"\n");
    		    var utftext = "";

    		    for (var n = 0; n < string.length; n++) {

    		        var c = string.charCodeAt(n);

    		        if (c < 128) {
    		            utftext += String.fromCharCode(c);
    		        }
    		        else if((c > 127) && (c < 2048)) {
    		            utftext += String.fromCharCode((c >> 6) | 192);
    		            utftext += String.fromCharCode((c & 63) | 128);
    		        }
    		        else {
    		            utftext += String.fromCharCode((c >> 12) | 224);
    		            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
    		            utftext += String.fromCharCode((c & 63) | 128);
    		        }

    		    }

    		    return utftext;
    		}    		
    	}                
};

global.davlib = new function() {
    /* WebDAV for JavaScript
    
        This is a library containing a low-level and (if loaded, see 
        'davfs.js') a high-level API for working with WebDAV capable servers
        from JavaScript. 

        Quick example of the low-level interface:

          var client = new davlib.DavClient();
          client.initialize();

          function alertContent(status, statusstring, content) {
            if (status != 200) {
              alert('error: ' + statusstring);
              return;
            };
            alert('content received: ' + content);
          };
          
          client.GET('/foo/bar.txt', alertContent);

        Quick example of the high-level interface:

          var fs = new davlib.DavFS();
          fs.initialize();

          function alertContent(error, content) {
            if (error) {
              alert('error: ' + error);
              return;
            };
            alert('content: ' + content);
          };

          fs.read('/foo/bar.txt', alertContent);

    */
    var davlib = this;

    this.DEBUG = 0;

    this.STATUS_CODES = {
        '100': 'Continue',
        '101': 'Switching Protocols',
        '102': 'Processing',
        '200': 'OK',
        '201': 'Created',
        '202': 'Accepted',
        '203': 'None-Authoritive Information',
        '204': 'No Content',
        '205': 'Reset Content',
        '206': 'Partial Content',
        '207': 'Multi-Status',
        '300': 'Multiple Choices',
        '301': 'Moved Permanently',
        '302': 'Found',
        '303': 'See Other',
        '304': 'Not Modified',
        '305': 'Use Proxy',
        '307': 'Redirect',
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '402': 'Payment Required',
        '403': 'Forbidden',
        '404': 'Not Found',
        '405': 'Method Not Allowed',
        '406': 'Not Acceptable',
        '407': 'Proxy Authentication Required',
        '408': 'Request Time-out',
        '409': 'Conflict',
        '410': 'Gone',
        '411': 'Length Required',
        '412': 'Precondition Failed',
        '413': 'Request Entity Too Large',
        '414': 'Request-URI Too Large',
        '415': 'Unsupported Media Type',
        '416': 'Requested range not satisfiable',
        '417': 'Expectation Failed',
        '422': 'Unprocessable Entity',
        '423': 'Locked',
        '424': 'Failed Dependency',
        '500': 'Internal Server Error',
        '501': 'Not Implemented',
        '502': 'Bad Gateway',
        '503': 'Service Unavailable',
        '504': 'Gateway Time-out',
        '505': 'HTTP Version not supported',
        '507': 'Insufficient Storage'
    };

    this.DavClient = function() {
        /* Low level (subset of) WebDAV client implementation 
        
            Basically what one would expect from a basic DAV client, it
            provides a method for every HTTP method used in basic DAV, it
            parses PROPFIND requests to handy JS structures and accepts 
            similar structures for PROPPATCH.
            
            Requests are handled asynchronously, so instead of waiting until
            the response is sent back from the server and returning the
            value directly, a handler is registered that is called when
            the response is available and the method that sent the request
            is ended. For that reason all request methods accept a 'handler'
            argument, which will be called (with 3 arguments: statuscode,
            statusstring and content (the latter only where appropriate))
            when the request is handled by the browser.
            The reason for this choice is that Mozilla sometimes freezes
            when using XMLHttpRequest for synchronous requests.

            The only 'public' methods on the class are the 'initialize'
            method, that needs to be called first thing after instantiating
            a DavClient object, and the methods that have a name similar to
            an HTTP method (GET, PUT, etc.). The latter all get at least a
            'path' argument, a 'handler' argument and a 'context' argument:

                'path' - an absolute path to the target resource
                'handler' - a function or method that will be called once
                        the request has finished (see below)
                'context' - the context used to call the handler, the
                        'this' variable inside methods, so usually the
                        object (instance) the handler is bound to (ignore 
                        when the handler is a function)

            All handlers are called with the same 3 arguments:
            
                'status' - the HTTP status code
                'statusstring' - a string representation (see STATUS_CODES
                        array above) of the status code
                'content' - can be a number of different things:
                        * when there was an error in a method that targets
                            a single resource, this contains the error body
                        * when there was an error in a method that targets
                            a set of resources (multi-status) it contains
                            a Root object instance (see below) that contains
                            the error messages of all the objects
                        * if the method was GET and there was no error, it
                            will contain the contents of the resource
                        * if the method was PROPFIND and there was no error,
                            it will contain a Root object (see below) that
                            contains the properties of all the resources
                            targeted
                        * if there was no error and there is no content to
                            return, it will contain null
                'headers' - a mapping (associative array) from lowercase header
                            name to value (string)

            Basic usage example:

                function handler(status, statusstring, content, headers) {
                    if (content) {
                        if (status != '200' && status != '204') {
                            if (status == '207') {
                                alert('not going to show multi-status ' +
                                        here...');
                            };
                            alert('Error: ' + statusstring);
                        } else {
                            alert('Content: ' + content);
                        };
                    };
                };

                var dc = new DavClient();
                dc.initialize('localhost');

                // create a directory
                dc.MKCOL('/foo', handler);

                // create a file and save some contents
                dc.PUT('/foo/bar.txt', 'baz?', handler);

                // load and alert it (alert happens in the handler)
                dc.GET('/foo/bar.txt', handler);

                // delete the dir
                dc.DELETE('/foo', handler);

            For detailed information about the HTTP methods and how they
            can/should be used in a DAV context, see http://www.webdav.org.

            If you have questions, bug reports, or patches, please file a report
            on https://github.com/svogler/jsdavclient 
            
        */
    };

    this.DavClient.prototype.initialize = function(host, port, protocol, username, password) {
        /* the 'constructor' (needs to be called explicitly!!) 
        
            host - the host name or IP
            port - HTTP port of the host (optional, defaults to 80)
            protocol - protocol part of URLs (optional, defaults to http)
            username - the username for authorization (only Basic auth is supported at that time)
            password - the password to use
        */
        this.host = host || location.hostname;
        this.port = port || location.port || 443;
        this.protocol = (protocol || location.protocol.substr(0, location.protocol.length - 1 ) || 'https');
        this.username = username || null;
        this.password = password || null;
        
        this.request = null;
    };

    this.DavClient.prototype.OPTIONS = function(path, handler, context) {
        /* perform an OPTIONS request

            find out which HTTP methods are understood by the server
        */
        // XXX how does this work with * paths?
        var request = this._getRequest('OPTIONS', path, handler, context);
        request.send('');
    };

    this.DavClient.prototype.GET = function(path, handler, context) {
        /* perform a GET request 
        
            retrieve the contents of a resource
        */
        var request = this._getRequest('GET', path, handler, context);
        request.send('');
    };

    this.DavClient.prototype.PUT = function(path, content, handler, 
                                            context, locktoken) {
        /* perform a PUT request 
        
            save the contents of a resource to the server

            'content' - the contents of the resource
        */
        var request = this._getRequest('PUT', path, handler, context);
        request.setRequestHeader("Content-type", "text/xml,charset=UTF-8");
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        request.send(content);
    };
    
    this.DavClient.prototype.PROPFIND = function(path, handler, context, depth) {
    	/* perform a PROPFIND request

		read the metadata of a resource (optionally including its children)

		'depth' - control recursion depth, default 0 (only returning the
		properties for the resource itself)
    	 */
    	var request = this._getRequest('PROPFIND', path, handler, context);
    	depth = depth || 0;
    	request.setRequestHeader('Depth', depth);
    	request.setRequestHeader('Content-type', 'text/xml; charset=UTF-8');
    	// 	XXX maybe we want to change this to allow getting selected props
    	var xml = '<?xml version="1.0" encoding="UTF-8" ?>' +
    	'<D:propfind xmlns:D="DAV:">' +
    	'<D:allprop />' +
    	'</D:propfind>';
    	request.send(xml);
    };        

    this.DavClient.prototype.DELETE = function(path, handler, context, locktoken) {
        /* perform a DELETE request 
        
            remove a resource (recursively)
        */
        var request = this._getRequest('DELETE', path, handler, context);
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        //request.setRequestHeader("Depth", "Infinity");
        request.send('');
    };

    this.DavClient.prototype.MKCOL = function(path, handler, 
                                              context, locktoken) {
        /* perform a MKCOL request

            create a collection
        */
        var request = this._getRequest('MKCOL', path, handler, context);
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        request.send('');
    };

    this.DavClient.prototype.COPY = function(path, topath, handler, context, overwrite, locktoken) {
        /* perform a COPY request

            create a copy of a resource

            'topath' - the path to copy the resource to
            'overwrite' - whether or not to fail when the resource 
                    already exists (optional)
        */
        var request = this._getRequest('COPY', path, handler, context);
        var tourl = this._generateUrl(topath);
        request.setRequestHeader("Destination", tourl);
        if (overwrite) {
            request.setRequestHeader("Overwrite", "F");
        };
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        request.send('');
    };

    this.DavClient.prototype.MOVE = function(path, topath, handler, context, overwrite, locktoken) {
        /* perform a MOVE request

            move a resource from location

            'topath' - the path to move the resource to
            'overwrite' - whether or not to fail when the resource
                    already exists (optional)
        */
        var request = this._getRequest('MOVE', path, handler, context);
        var tourl = this._generateUrl(topath);
        request.setRequestHeader("Destination", tourl);
        if (overwrite) {
            request.setRequestHeader("Overwrite", "F");
        };
        if (locktoken) {
            request.setRequestHeader('If', '<' + locktoken + '>');
        };
        request.send('');
    };



    this.DavClient.prototype._getRequest = function(method, path, 
                                                    handler, context) {
        /* prepare a request */
        var request = davlib.getXmlHttpRequest();
        request.onreadystatechange = this._wrapHandler(handler, request, context);

        var url = this._generateUrl(path);
        request.open(method, url, true);
        request.setRequestHeader('Accept-Encoding', ' ');
        request.setRequestHeader('Authorization', this._createBasicAuth(this.username, this.password));        		
        
        return request
    };

    this.DavClient.prototype._wrapHandler = function(handler, request, context) {
        /* wrap the handler with a callback

            The callback handles multi-status parsing and calls the client's
            handler when done
        */
        var self = this;
        
        function HandlerWrapper() {
            this.execute = function() {
                if (request.readyState == 4) {
                    var status = request.status.toString();
                    var headers = self._parseHeaders(request.getAllResponseHeaders());
                    var content = request.responseText;
                    var statusstring = davlib.STATUS_CODES[status];
                    handler.call(context, status, statusstring, content, headers);
                };
            };
        };
        return (new HandlerWrapper().execute);
    };


    this.DavClient.prototype._generateUrl = function(path){
        /* convert a url from a path */
        var url = this.protocol + '://' + this.host;
        if (this.port) {
            url += ':' + this.port;
        };
        url += path;
        return url;
    };

    
    this.DavClient.prototype._createBasicAuth = function (user, password) {
    	  var tok = user + ':' + password;
    	  var hash = string.encodeBase64(tok);
    	  return "Basic " + hash;
    }


    this.DavClient.prototype._parseHeaders = function(headerstring) {
        var lines = headerstring.split('\n');
        var headers = {};
        for (var i=0; i < lines.length; i++) {
            var line = string.strip(lines[i]);
            if (!line) {
                continue;
            };
            var chunks = line.split(':');
            var key = string.strip(chunks.shift());
            var value = string.strip(chunks.join(':'));
            var lkey = key.toLowerCase();
            if (headers[lkey] !== undefined) {
                if (!headers[lkey].push) {
                    headers[lkey] = [headers[lkey, value]];
                } else {
                    headers[lkey].push(value);
                };
            } else {
                headers[lkey] = value;
            };
        };
        return headers;
    };

    // some helper functions
    this.getXmlHttpRequest = function() {
        /* instantiate an XMLHTTPRequest 

            this can be improved by testing the user agent better and, in case 
            of IE, finding out which MSXML is installed and such, but it 
            seems to work just fine for now
        */
        try{
            return new XMLHttpRequest();
        } catch(e) {
            // not a Mozilla or Konqueror based browser
        };
        try {
            return new ActiveXObject('Microsoft.XMLHTTP');
        } catch(e) {
            // not IE either...
        };
        alert('Your browser does not support XMLHttpRequest, required for ' +
                'WebDAV access.');
        throw('Browser not supported');
    };

    this.debug = function(text) {
        /* simple debug function

            set the DEBUG global to some true value, and messages will appear
            on the bottom of the document
        */
        if (!davlib.DEBUG) {
            return;
        };
        var div = document.createElement('div');
        var text = document.createTextNode(text);
        div.appendChild(text);
        document.getElementsByTagName('body')[0].appendChild(div);
    };
}();

