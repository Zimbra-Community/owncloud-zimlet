(function(context) {
  /**
   * Supported DAV Actions.
   * @const
   * @enum {string}
   */
  var DavAction = {
    PROPFIND: 'PROPFIND',
    GET: 'GET',
    MKCOL: 'MKCOL'
  };

  /**
   * Define an entity retrieved by the Dav Connector.
   * @param {boolean} isDirectory
   * @param {string} name
   * @param {string} path
   * @constructor
   */
  function DavEntity(isDirectory, name, path) {
    /** @private {boolean} */ this._isDirectory = isDirectory;
    /** @private {string} */ this._name = name;
    /** @private {string} */ this._path = path;
  }
  DavEntity.prototype = {};
  DavEntity.prototype.constructor = DavEntity;

  /**
   * Get if the entity is a directory.
   * @return {boolean}
   */
  DavEntity.prototype.isDirectory = function() {
    return this._isDirectory;
  };

  /**
   * Get the entity name.
   * @return {string}
   */
  DavEntity.prototype.getName = function() {
    return this._name;
  };

  /**
   * Get the path of the entity.
   * @return {string}
   */
  DavEntity.prototype.getPath = function() {
    return this._path;
  };


  /**
   * DAV connector client for DAV connector extension.
   * @constructor
   */
  function DavConnector() {}
  DavConnector.prototype = {};
  DavConnector.prototype.constructor = DavConnector;

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
    var response;
    if (result.isException() && !!errorCallback) {
      errorCallback.run(result);
      return void 0;
    }
    response = result.getResponse().response[action];

    if (action === DavAction.GET)
    {
      callback.run(response);
    }
    else if(action === DavAction.PROPFIND)
    {
      var rawEntityArray = JSON.parse(response),
        rawEntity,
        entityArray = [],
        i = 0;
      for (i = 0; i < rawEntityArray.length; i += 1)
      {
        rawEntity = rawEntityArray[i];
        entityArray.push(
          new DavEntity(
            rawEntity.isDirectory,
            rawEntity.name,
            rawEntity.path
          )
        );
      }
      callback.run(entityArray);
    }
    else
    {
      errorCallback.run(new Error('DAV Action "' + action + '" not handled.'));
    }
  };

  /**
   * Handle an error occurred during the request and trigger the error callback.
   * @param {AjxCallback} errorCallback
   * @private
   * @static
   */
  DavConnector._handleError = function(errorCallback, error) {
    if (!!errorCallback) {
      errorCallback.run(error);
    }
  };

  /* Expose these object to the scope */
  context.DavConnector = DavConnector;
})(this);
