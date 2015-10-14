(function(context) {
  /**
   * Supported DAV Actions.
   * @const
   * @enum {string}
   */
  var DavAction = {
    COPY: 'COPY',
    DELETE: 'DELETE',
    GET: 'GET',
    MKCOL: 'MKCOL',
    MOVE: 'MOVE',
    PROPFIND: 'PROPFIND',
    PUT: 'PUT'
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
  }
  DavResource.prototype = {};
  DavResource.prototype.constructor = DavResource;

  /**
   * Extract data from a raw json object and convert it to DAV Entity.
   * @param {{}} rawEntity
   * @return {DavResource}
   * @static
   */
  DavResource.fromRawResource = function(rawEntity) {
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
    return 'httpd/unix-directory' === this._contentType;
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
   * Get the path of the entity.
   * @return {string}
   */
  DavResource.prototype.getHref = function() {
    return this._href;
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
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  DavConnector.prototype.copy = function(path, destPath, overwrite, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount');
    soapDoc.set('path', path);
    soapDoc.set('destPath', destPath);
    soapDoc.set('overwrite', 'false');
    if (overwrite === true) soapDoc.set('overwrite', 'true');
    DavConnector._sendRequest(DavAction.COPY, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a DELETE request
   * Remove a resource (recursively)
   * @param {string} path
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  DavConnector.prototype.delete = function(path, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount');
    soapDoc.set('path', path);
    DavConnector._sendRequest(DavAction.DELETE, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a GET request
   * Retrieve the contents of a resource
   * @param {string} path
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  DavConnector.prototype.get = function(path, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount');
    soapDoc.set('path', path);
    DavConnector._sendRequest(DavAction.GET, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a MKCOL request
   * Create a collection
   * @param {string} path
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  DavConnector.prototype.mkcol = function(path, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount'),
      escapedPath = path.replace(' ', '%20');
    soapDoc.set('path', escapedPath);
    DavConnector._sendRequest(DavAction.MKCOL, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a MOVE request.
   * Move a resource from location
   * @param {string} path
   * @param {string} destPath
   * @param {boolean} overwrite
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  DavConnector.prototype.move = function(path, destPath, overwrite, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount');
    soapDoc.set('path', path);
    soapDoc.set('destPath', destPath);
    soapDoc.set('overwrite', 'false');
    if (overwrite === true) soapDoc.set('overwrite', 'true');
    DavConnector._sendRequest(DavAction.MOVE, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a PROPFIND request
   * Read the metadata of a resource (optionally including its children)
   * @param {string} path
   * @param {number} depth, control recursion default 0 (only returning the properties for the resource itself)
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  DavConnector.prototype.propfind = function(path, depth, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount');
    soapDoc.set('path', path);
    soapDoc.set('depth', depth);
    DavConnector._sendRequest(DavAction.PROPFIND, soapDoc, callback, errorCallback);
  };

  /**
   * Perform a PUT request
   * Read the metadata of a resource (optionally including its children)
   * @param {string} path
   * @param {string} data, control recursion default 0 (only returning the properties for the resource itself)
   * @param {string} contentType
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  DavConnector.prototype.put = function(path, data, contentType, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount');
    soapDoc.set('path', path);
    soapDoc.set('data', data);
    soapDoc.set('contentType', contentType);
    DavConnector._sendRequest(DavAction.PUT, soapDoc, callback, errorCallback);
  };

  /**
   * Send the request to the server soap extension.
   * @param {string} action, one defined into {@see DavAction}
   * @param {AjxSoapDoc} soapDoc
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   * @private
   * @static
   */
  DavConnector._sendRequest = function(action, soapDoc, callback, errorCallback) {
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
            console.error(result);
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
      errorCallback.run(JSON.parse(response.error));
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
      callback.run(entityArray);
    }
    else if(action === DavAction.PUT)
    {
      callback.run(response[action]);
    }
    else
    {
      errorCallback.run(new Error('DAV Action "' + action + '" not handled.'));
    }
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
      rawEntity,
      entityArray = [],
      i = 0;
    for (i = 0; i < rawEntityArray.length; i += 1)
    {
      rawEntity = rawEntityArray[i];
      entityArray.push(
        DavResource.fromRawResource(rawEntity)
      );
    }
    return entityArray;
  };

  /**
   * Handle an error occurred during the request and trigger the error callback.
   * @param {string} action, one defined into {@see DavAction}
   * @param {AjxCallback} errorCallback
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
