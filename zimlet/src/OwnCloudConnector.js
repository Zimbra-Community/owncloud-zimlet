(function(context) {
  /**
   * Urn of the request
   * @const
   * @type {string}
   */
  var URN = 'urn:zimbraAccount';
  /**
   * Handler name registerd as zimbra SOAP Extension
   * @const
   * @type {string}
   */
  var HANDLER_NAME = 'ownCloud';

  /**
   * Supported OwnCloud Actions.
   * @const
   * @enum {string}
   */
  var OwnCloudAction = {
    GET_ALL_SHARES: 'getAllShares',
    GET_SHARES_FROM_FOLDER: 'getSharesFromFolder',
    GET_SHARE_BY_ID: 'getShareById'
  };

  /**
   * OwnCloud connector client for OwnCloud server extension.
   * @constructor
   */
  function OwnCloudConnector() {}
  OwnCloudConnector.prototype = {};
  OwnCloudConnector.prototype.constructor = OwnCloudConnector;

  /**
   * Get all shares from the user.
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  OwnCloudConnector.prototype.getAllShares = function(callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    OwnCloudConnector._sendRequest(OwnCloudAction.GET_ALL_SHARES, soapDoc, callback, errorCallback);
  };

  /**
   * Get all shares from a given file/folder.
   * @param {string} path Path to file/folder
   * @param {boolean} reshares Returns not only the shares from the current user but all shares from the given file.
   * @param {boolean} subfiles Returns all shares within a folder, given that path defines a folder.
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  OwnCloudConnector.prototype.getSharesFromFolder = function(path, reshares, subfiles, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', path);
    soapDoc.set('reshares', reshares || false);
    soapDoc.set('subfiles', subfiles || true);
    OwnCloudConnector._sendRequest(OwnCloudAction.GET_SHARES_FROM_FOLDER, soapDoc, callback, errorCallback);
  };

  /**
   * Get information about a given share.
   * @param {string} shareId Share ID
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  OwnCloudConnector.prototype.getShareById = function(shareId, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('shareId', shareId);
    OwnCloudConnector._sendRequest(OwnCloudAction.GET_SHARE_BY_ID, soapDoc, callback, errorCallback);
  };

  /**
   * Send the request to the server soap extension.
   * @param {string} action
   * @param {AjxSoapDoc} soapDoc
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   * @private
   * @static
   */
  OwnCloudConnector._sendRequest = function(action, soapDoc, callback, errorCallback) {
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
      callback: new AjxCallback(void 0, OwnCloudConnector._parseResponse, [action, callback, errorCallback]),
      errorCallback: new AjxCallback(void 0, OwnCloudConnector._handleError, [action, errorCallback])
    };

    appCtxt.getAppController().sendRequest(params);
  };

  /**
   * Parse the response of a request and trigger the callback.
   * @param {string} action
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   * @param {ZmCsfeResult} result
   * @private
   * @static
   */
  OwnCloudConnector._parseResponse = function(action, callback, errorCallback, result) {
    var response = result.getResponse().response;
    if (result.isException() && !!errorCallback) {
      errorCallback.run(result);
      return void 0;
    }
    if (!!response.error) {
      errorCallback.run(JSON.parse(response.error));
      return void 0;
    }

    if (action === OwnCloudAction.GET_ALL_SHARES) {
      callback.run(JSON.parse(response[action]));
    }
    else if (action === OwnCloudAction.GET_SHARES_FROM_FOLDER)
    {
      callback.run(JSON.parse(response[action]));
    }
    else if (action === OwnCloudAction.GET_SHARE_BY_ID)
    {
      callback.run(JSON.parse(response[action]));
    }
    else
    {
      errorCallback.run(new Error('OwnCloud Action "' + action + '" not handled.'));
    }
  };

  /**
   * Handle an error occurred during the request and trigger the error callback.
   * @param {string} action
   * @param {AjxCallback} errorCallback
   * @param {Error} error
   * @private
   * @static
   */
  OwnCloudConnector._handleError = function(action, errorCallback, error) {
    if (!!errorCallback) {
      errorCallback.run(error);
    }
  };

  /* Expose these object to the scope */
  context.OwnCloudConnector = OwnCloudConnector;
})(this);
