;(function(context) {
  /**
   * Urn of the request
   * @const
   * @type {string}
   */
  var URN = 'urn:zimbraAccount';
  /**
   * Handler name registered as zimbra SOAP Extension
   * @const
   * @type {string}
   */
  var HANDLER_NAME = 'davSoapConnector';
  /**
   * Supported DAV Actions.
   * @const
   * @enum {string}
   */
  var DavAction = {
    COPY: 'COPY',
    DELETE: 'DELETE',
    GET: 'GET',
    GET_LINK: 'GET_LINK',
    MKCOL: 'MKCOL',
    MOVE: 'MOVE',
    PROPFIND: 'PROPFIND',
    PUT: 'PUT',
    SEARCH: 'SEARCH'
  };

  var ZimbraItemType = {
    UNKNOWN: -1,
    FOLDER: 1,
    SEARCHFOLDER: 2,
    TAG: 3,
    CONVERSATION: 4,
    MESSAGE: 5,
    CONTACT: 6,
    /** @deprecated */ INVITE: 7,
    DOCUMENT: 8,
    NOTE: 9,
    FLAG: 10,
    APPOINTMENT: 11,
    VIRTUAL_CONVERSATION: 12,
    MOUNTPOINT: 13,
    /** @deprecated */ WIKI: 14,
    TASK: 15,
    CHAT: 16,
    COMMENT: 17,
    LINK: 18
  };

  /**
   * Define an entity retrieved by the Dav Connector.
   * @param {string} href
   * @param {Date} creation
   * @param {Date} modified
   * @param {string} contentType
   * @param {number} contentLength
   * @param {string} etag
   * @param {string} displayName
   * @param {string[]} resourceTypes,
   * @param {string} contentLanguage
   * @param {string[]} supportedReports
   * @param {{}} customProps
   * @constructor
   */
  function DavResource(
    href,
    creation,
    modified,
    contentType,
    contentLength,
    etag,
    displayName,
    resourceTypes,
    contentLanguage,
    supportedReports,
    customProps
  ) {
    /** @private {string} */ this._href = href;
    /** @private {Date} */ this._creation = creation;
    /** @private {Date} */ this._modified = modified;
    /** @private {string} */ this._contentType = contentType;
    /** @private {number} */ this._contentLength = contentLength;
    /** @private {string} */ this._etag = etag;
    /** @private {string} */ this._displayName = displayName;
    /** @private {string[]} */ this._resourceTypes = resourceTypes;
    /** @private {string[]} */ this._contentLanguage = contentLanguage;
    /** @private {string[]} */ this._supportedReports = supportedReports;
    /** @private {{}} */ this._customProps = customProps;
    this._children = [];
  }
  DavResource.prototype = {};
  DavResource.prototype.constructor = DavResource;

  DavResource.prototype.toString = function() {
    return "DavResource";
  };

  /**
   * Extract data from a raw json object and convert it to DAV Entity.
   * @param {{}} rawEntity
   * @return {DavResource}
   * @static
   */
  DavResource.fromRawResource = function(rawEntity) {

   //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
   //support for endsWith in IE11
   if (!String.prototype.endsWith)
     String.prototype.endsWith = function(searchStr, Position) {
         // This works much better than >= because
         // it compensates for NaN:
         if (!(Position < this.length))
           Position = this.length;
         else
           Position |= 0; // round position
         return this.substr(Position - searchStr.length,
                            searchStr.length) === searchStr;
     };

     if(rawEntity.href.endsWith("/"))
     {
       rawEntity.contentType = 'httpd/unix-directory';
     }

     //Fix for Nuxeo, add / at the end of the URL
     if(rawEntity.contentType == 'httpd/unix-directory' && !rawEntity.href.endsWith("/"))
     {
        rawEntity.href = rawEntity.href + '/';
     }

      //Not all dav servers implement content/type correctly, so use them accoring to extension
      switch (rawEntity.href) {
        case (rawEntity.href.match(/\.djvu$/i) || {}).input:
             rawEntity.contentType = 'image/vnd.djvu';
          break;
        case (rawEntity.href.match(/\.jpeg$/i) || {}).input:
             rawEntity.contentType = 'image/jpeg';
          break;      
        case (rawEntity.href.match(/\.jpg$/i) || {}).input:
             rawEntity.contentType = 'image/jpg';
          break;      
        case (rawEntity.href.match(/\.pdf$/i) || {}).input:
             rawEntity.contentType = 'application/pdf';
          break;       
        case (rawEntity.href.match(/\.odt$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.oasis.opendocument.text';
          break;
        case (rawEntity.href.match(/\.ods$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.oasis.opendocument.spreadsheet';
          break;
        case (rawEntity.href.match(/\.odp$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.oasis.opendocument.presentation';
          break;
        case (rawEntity.href.match(/\.mp4$/i) || {}).input:
             rawEntity.contentType = 'video/mp4';
          break;
        case (rawEntity.href.match(/\.webm$/i) || {}).input:
             rawEntity.contentType = 'video/webm';
          break;
        case (rawEntity.href.match(/\.png$/i) || {}).input:
             rawEntity.contentType = 'image/png';
          break;
        case (rawEntity.href.match(/\.txt$/i) || {}).input:
             rawEntity.contentType = 'text/plain';
          break;
        case (rawEntity.href.match(/\.md$/i) || {}).input:
             rawEntity.contentType = 'text/plain';
          break;
        case (rawEntity.href.match(/\.doc$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.ms-word';
          break;
        case (rawEntity.href.match(/\.docx$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case (rawEntity.href.match(/\.xls$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.ms-excel';
          break;
        case (rawEntity.href.match(/\.xlsx$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case (rawEntity.href.match(/\.ppt$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.ms-powerpoint';
          break;
        case (rawEntity.href.match(/\.pptx$/i) || {}).input:
             rawEntity.contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
      }  

    return new DavResource(
      rawEntity.href,
      (!!rawEntity.created) ? new Date(rawEntity.created) : null,
      (!!rawEntity.modified) ? new Date(rawEntity.modified) : null,
      rawEntity.contentType,
      rawEntity.contentLength,
      rawEntity.etag,
      rawEntity.displayName,
      rawEntity.resourceTypes,
      rawEntity.contentLanguage,
      rawEntity.supportedReports,
      rawEntity.customProps
    );
  };

  /**
   * Get if the entity is a directory.
   * @return {boolean}
   */
  DavResource.prototype.isDirectory = function() {
     if( (this._href.endsWith("/")) || ('httpd/unix-directory' === this._contentType) )
     {
       return true;
     }
     else
     {
        return false;
     }  
  };

  /**
   * Get the entity name (Last path component).
   * @return {string}
   */
  DavResource.prototype.getName = function() {
    var path = this.getHref();
    if (/\/$/.test(path)) {
      path = path.substr(0, path.length - 1);
    }
    return path.substr(path.lastIndexOf('/') + 1);
  };

  /**
   * Get the entity path.
   * @return {string}
   */
  DavResource.prototype.getPath = function() {
    var splitted = this.getHref().split("/");
    splitted.pop();
    if (this.isDirectory()) {
      splitted.pop();
    }
    return splitted.join("/");
  };

  /**
   * Get the path of the entity.
   * @return {string}
   */
  DavResource.prototype.getHref = function() {
    return this._href;
  };

  /**
   * Get the content type of the entity.
   * @return {string}
   */
  DavResource.prototype.getContentType = function() {
    return this._contentType;
  };

  /**
   * Get the content length of the entity.
   * @return {number}
   */
  DavResource.prototype.getContentLength = function() {
    return this._contentLength;
  };

  /**
   * Get the content modified date of the entity.
   * @return {Date}
   */
  DavResource.prototype.getModified = function() {
    return this._modified;
  };

  /**
   * Add a child to the resource.
   * @param {DavResource} child
   */
  DavResource.prototype.addChild = function(child) {
    this._children.push(child);
  };

  /**
   * Get the resource children.
   * @return {DavResource[]}
   */
  DavResource.prototype.getChildren = function() 
  {
      return this._children.sort(function(a, b) {
         switch(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_item']) {
            case 'na':
               var nameA = a._href.toUpperCase(); // ignore upper and lowercase
               var nameB = b._href.toUpperCase(); // ignore upper and lowercase
            break;
            case 'sz':
               var nameA = a._contentLength; 
               var nameB = b._contentLength; 
            break;
            case 'ft':
               var nameA = a._contentType; 
               var nameB = b._contentType; 
            break;
            case 'dt':
               var nameA = a._modified; 
               var nameB = b._modified; 
            break;
      }
   
      if (nameA < nameB) {
         if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_asc']==true)
         {
            return -1;
         }
         else
         {
            return 1;   
         }
      }
      if (nameA > nameB) {
         if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_asc']==true)
         {
            return 1;
         }
         else
         {
            return -1;   
         }
      }      
      // names must be equal
      return 0;
      });
  };  

  /**
   * Remove all resource children.
   * @return {DavResource[]}
   */
  DavResource.prototype.removeAllChildren = function() {
    this._children = [];
  };

  /**
   * DAV connector client for DAV connector extension.
   * @constructor
   */
  function DavConnector() {}
  DavConnector.prototype = {};
  DavConnector.prototype.constructor = DavConnector;

  /**
   * Perform a COPY request.
   * Create a copy of a resource
   * @param {string} path
   * @param {string} destPath
   * @param {boolean} overwrite
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.copy = function(path, destPath, overwrite, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', encodeURIComponent(path).replace(/%2F/g,'/'));
    soapDoc.set('destPath', encodeURIComponent(destPath).replace(/%2F/g,'/'));
    soapDoc.set('overwrite', 'false');
    if (overwrite === true) soapDoc.set('overwrite', 'true');
    DavConnector._sendRequest(DavAction.COPY, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a DELETE request
   * Remove a resource (recursively)
   * @param {string} path
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.rm = function(path, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', encodeURIComponent(path).replace(/%2F/g,'/'));
    DavConnector._sendRequest(DavAction.DELETE, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a GET request
   * Retrieve the contents of a resource
   * @param {string} path
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.get = function(path, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', encodeURIComponent(path).replace(/%2F/g,'/'));
    DavConnector._sendRequest(DavAction.GET, soapDoc, callback, errorCallback);
  };

  /**
   * Create a temporary link to download a file.
   * Retrieve a temporary link to start the download a resource.
   * @param {string} path
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.getDownloadLink = function(path, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', encodeURIComponent(path).replace(/%2F/g,'/'));
    DavConnector._sendRequest(DavAction.GET_LINK, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a MKCOL request
   * Create a collection
   * @param {string} path
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.mkcol = function(path, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', encodeURIComponent(path).replace(/%2F/g,'/'));
    DavConnector._sendRequest(DavAction.MKCOL, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a MOVE request.
   * Move a resource from location
   * @param {string} path
   * @param {string} destPath
   * @param {boolean} overwrite
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.move = function(path, destPath, overwrite, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', encodeURIComponent(path).replace(/%2F/g,'/'));
    soapDoc.set('destPath', encodeURIComponent(destPath).replace(/%2F/g,'/'));
    soapDoc.set('overwrite', 'false');
    if (overwrite === true) soapDoc.set('overwrite', 'true');
    DavConnector._sendRequest(DavAction.MOVE, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a PROPFIND request
   * Read the metadata of a resource (optionally including its children)
   * @param {string} path
   * @param {number} depth, control recursion default 0 (only returning the properties for the resource itself)
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.propfind = function(path, depth, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', encodeURIComponent(path).replace(/%2F/g,'/'));
    soapDoc.set('depth', depth);
    DavConnector._sendRequest(DavAction.PROPFIND, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a PUT request
   * Read the metadata of a resource (optionally including its children)
   * @param {string} path
   * @param {string} data, control recursion default 0 (only returning the properties for the resource itself)
   * @param {string} contentType
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.put = function(path, data, contentType, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', encodeURIComponent(path).replace(/%2F/g,'/'));
    soapDoc.set('data', data);
    soapDoc.set('contentType', contentType);
    DavConnector._sendRequest(DavAction.PUT, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a SEARCH request
   * Search for files by property, currently only displayname implemented, supports % wildcard
   * @param {string} search, string to look for
   * @param {string} url, full url to WebDAV interface
   * @param {string} path, folder to search in
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavConnector.prototype.search = function(search, path, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('search', '%'+search.replace(/ /g, '%')+'%');    
    
    if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'].indexOf('remote.php/webdav') > -1)
    {
       if (path == '/')
       {
          path = '/files/'+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']+'/';
       }
       else
       {
          path = path.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'],'/files/'+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']+'/');  
       }
    }
    
    soapDoc.set('path', path);          
    DavConnector._sendRequest(DavAction.SEARCH, soapDoc, callback, errorCallback);
  };

  /**
   * Send the request to the server soap extension.
   * @param {string} action, one defined into {@see DavAction}
   * @param {AjxSoapDoc} soapDoc
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   * @private
   * @static
   */
  DavConnector._sendRequest = function(action, soapDoc, callback, errorCallback) {
    if(action == 'SEARCH')
    {
       //nextcloud wtf
       soapDoc.set('owncloud_zimlet_server_path', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'].replace('remote.php/webdav','remote.php/dav').replace(/\/$/, ""));
    }
    else
    {
       soapDoc.set('owncloud_zimlet_server_path', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']);
    }
    soapDoc.set('owncloud_zimlet_password', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
    soapDoc.set('owncloud_zimlet_username', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']);
    soapDoc.set('owncloud_zimlet_server_name', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']);
    soapDoc.set('owncloud_zimlet_server_port', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port']);    
    soapDoc.set('owncloud_zimlet_oc_folder', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']); 
    // Injecting fake callbacks, the debug will be much faster.
    if (!callback) {
      callback = new AjxCallback(
        void 0,
        function(result) {
          if (!!console && !!console.log)
            console.log(result);
        }
      );
    }
    if (!errorCallback) {
      errorCallback = new AjxCallback(
        void 0, function(result) {
          if (!!console && !!console.error)
            //console.error(result);
            var noop = null;
        }
      );
    }

    soapDoc.set('action', action);
    var params = {
      soapDoc: soapDoc,
      asyncMode: true,
      callback: new AjxCallback(void 0, DavConnector._parseResponse, [action, callback, errorCallback]),
      errorCallback: new AjxCallback(void 0, DavConnector._handleError, [action, errorCallback])
    };

    appCtxt.getAppController().sendRequest(params);
  };

  /**
   * Parse the response of a request and trigger the callback.
   * @param {string} action, one defined into {@see DavAction}
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   * @param {ZmCsfeResult} result
   * @private
   * @static
   */
  DavConnector._parseResponse = function(action, callback, errorCallback, result) {
    var response = result.getResponse().response;
    if (result.isException() && !!errorCallback) {
      errorCallback.run(result);
      return void 0;
    }
    if (!!response.error) {
      errorCallback.run(-1, JSON.parse(response.error));
      return void 0;
    }

    if (action === DavAction.COPY) {
      callback.run(response[action]);
    } else if (action === DavAction.DELETE)
    {
      callback.run(response[action]);
    } else if (action === DavAction.GET)
    {
      callback.run(response[action]);
    } else if (action === DavAction.GET_LINK)
    {
      callback.run(response[action]);
    }
    else if(action === DavAction.MOVE)
    {
      callback.run(response[action]);
    }
    else if(action === DavAction.MKCOL)
    {
      callback.run(response[action]);
    }
    else if(action === DavAction.PROPFIND)
    {
      callback.run(
        DavConnector._parsePropfind(response[action])
      );
    }
    else if(action === DavAction.PUT)
    {
      callback.run(response[action]);
    }
    else if(action === DavAction.SEARCH)
    {
      callback.run(
        DavConnector._parseSearch(response[action])
      );
    }    
    else
    {
      errorCallback.run(-2, new Error('DAV Action "' + action + '" not handled.'));
    }
  };

  /**
   * Parse the response of the SEARCH request.
   * @param {string} rawResponse
   * @return {DavResource[]}
   * @private
   * @static
   */
  DavConnector._parseSearch = function (rawResponse) {
     var rawEntityArray = JSON.parse(rawResponse);
     var entityArray = [];
     for (i = 0; i < rawEntityArray.length; i += 1) {
        var rawEntity = rawEntityArray[i];
        resource = DavResource.fromRawResource(rawEntity);
        
        //fix nextcloud, why is dav !== webdav?
        if(resource._href.indexOf('remote.php/dav')> -1)
        {
           resource._href = resource._href.replace('remote.php/dav', 'remote.php/webdav');
           resource._href = resource._href.replace('/files/'+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'],'');
        }
        entityArray.push(resource);
     }
     return entityArray;
  };


  /**
   * Parse the response of the propfind request.
   * @param {string} rawResponse
   * @return {DavResource[]}
   * @private
   * @static
   */
  DavConnector._parsePropfind = function (rawResponse) {
    var rawEntityArray = JSON.parse(rawResponse),
      entityArray = [],
      pathToFolders = {},
      pathToWeight = {},
      distanceFromRoot = {},
      closestWeight = -1,
      i = 0,
      weight;
    // Convert raw data to DavResources and map them paths
    for (i = 0; i < rawEntityArray.length; i += 1) {
      var rawEntity = rawEntityArray[i],
        resource = DavResource.fromRawResource(rawEntity);
      if (resource.isDirectory()) {
        if (resource.getHref() === "/") {
          weight = 0;
        } else {
          weight = resource.getHref().split("/").length - 2;
        }
        pathToFolders[resource.getHref()] = resource;
      } else {
        weight = resource.getHref().split("/").length - 1;
      }
      pathToWeight[resource.getHref()] = weight;
      if (!distanceFromRoot.hasOwnProperty(weight)) {
        distanceFromRoot[weight] = [];
      }
      distanceFromRoot[weight].push(resource);
      if (weight > closestWeight) {
        closestWeight = weight;
      }
      entityArray.push(resource);
    }
    // Connect fathers with children and
    // assign a weight based on the distance from the root
    for (i = 0; i < entityArray.length; i += 1) {
      var entity = entityArray[i],
        parentHref;

      weight = pathToWeight[entity.getHref()];
      if (weight < closestWeight) {
        closestWeight = weight;
      }

      parentHref = entity.getHref().split("/");
      parentHref.pop();
      if (entity.isDirectory()) {
        parentHref.pop();
      }
      parentHref.push("");
      parentHref = parentHref.join("/");
      if (pathToFolders.hasOwnProperty(parentHref)) {
        pathToFolders[parentHref].addChild(entity);
      }
    }
    // Return the array more closests from the root.
    return distanceFromRoot[closestWeight];
  };

  /**
   * Handle an error occurred during the request and trigger the error callback.
   * @param {string} action, one defined into {@see DavAction}
   * @param {AjxCallback} errorCallback
   * @param {Error} error
   * @private
   * @static
   */
  DavConnector._handleError = function(action, errorCallback, error) {
    if (!!errorCallback) {
      errorCallback.run(error);
    }
  };

  /* Expose these object to the scope */
  context.DavConnector = DavConnector;
})(this);
