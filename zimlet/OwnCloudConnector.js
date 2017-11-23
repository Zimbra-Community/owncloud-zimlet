;(function(context) {
  /**
   * Urn of the request
   * @const
   * @type {string}
   */
  var URN = 'urn:OCS';
  /**
   * Handler name registered as zimbra SOAP Extension
   * @const
   * @type {string}
   */
  var HANDLER_NAME = 'OCS';

  /**
   * Supported OwnCloud Actions.
   * @const
   * @enum {string}
   */
  var OwnCloudAction = {
    GET_ALL_SHARES: 'getAllShares',
    GET_SHARES_FROM_FOLDER: 'getSharesFromFolder',
    GET_SHARE_BY_ID: 'getShareById',
    CREATE_SHARE: 'createShare',
    DELETE_SHARE_BY_ID: 'deleteShareById',
    UPDATE_SHARE: 'updateShare'
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
   * Share a new file/folder with a user/group or as a public link.
   * @param {string} path Path to the file/folder which should be shared.
   * @param {number} shareType 0 = user; 1 = group; 3 = public link; 6 = federated cloud share
   * @param {string} shareWith User/Group id with which the file should be shared.
   * @param {boolean} publicUpload Allow public upload to a public shared folder.
   * @param {string} password Password to pretect public link Share with.
   * @param {number} permissions 1 = read; 2 = update; 4 = create; 8 = delete; 16 = share; 31 = all
   *                             (default: 31, for public shares: 1)
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  OwnCloudConnector.prototype.createShare = function(
    path,
    shareType,
    shareWith,
    publicUpload,
    password,
    permissions,
    expiryDate,
    callback,
    errorCallback
  ) {
    publicUpload = (publicUpload === true || publicUpload === false)? publicUpload : void 0;
    var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    path = path.replace(zimletInstance.getUserProperty('owncloud_zimlet_server_path'),'');
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('path', path);
    soapDoc.set('shareType', shareType);
    soapDoc.set('shareWith', shareWith);
    soapDoc.set('publicUpload', publicUpload);
    soapDoc.set('password', password);
    soapDoc.set('permissions', permissions);
    soapDoc.set('expiryDate', expiryDate);
    OwnCloudConnector._sendRequest(OwnCloudAction.CREATE_SHARE, soapDoc, callback, errorCallback);
  };

  /**
   * Remove the given share.
   * @param {string} shareId Share ID
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  OwnCloudConnector.prototype.deleteShareById = function(shareId, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('shareId', shareId);
    OwnCloudConnector._sendRequest(OwnCloudAction.DELETE_SHARE_BY_ID, soapDoc, callback, errorCallback);
  };

  /**
   * Update a given share.
   * @param {string} shareId Share ID
   * @param {number=null} permissions Update permissions {@see OwnCloudConnector.prototype.createShare}.
   * @param {string=null} password Updated password for public link share.
   * @param {boolean=null} publicUpload enable(true)/disable(false) public upload for public shares.
   * @param {string=null} expireDate Set a expire date for public link shares. This argument expects a well formatted
   *                                 date string eg. 'YYYY-MM-DD'
   * @param {AjxCallback} callback
   * @param {AjxCallback} errorCallback
   */
  OwnCloudConnector.prototype.updateShare = function(
    shareId,
    permissions,
    password,
    publicUpload,
    expireDate,
    callback,
    errorCallback
  ) {
    permissions = permissions || void 0;
    password = password || void 0;
    publicUpload = (publicUpload === true || publicUpload === false)? publicUpload : void 0;
    expireDate = expireDate || void 0;

    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('shareId', shareId);
    if (typeof permissions !== 'undefined') { soapDoc.set('permissions', permissions); }
    if (typeof password !== 'undefined') { soapDoc.set('password', password); }
    if (typeof publicUpload !== 'undefined') { soapDoc.set('publicUpload', publicUpload); }
    if (typeof expireDate !== 'undefined') { soapDoc.set('expireDate', expireDate); }

    OwnCloudConnector._sendRequest(OwnCloudAction.UPDATE_SHARE, soapDoc, callback, errorCallback);
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
    soapDoc.set('owncloud_zimlet_password', encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']));
    soapDoc.set('owncloud_zimlet_username', encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']));
    soapDoc.set('owncloud_zimlet_server_name', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']);
    soapDoc.set('owncloud_zimlet_server_port', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port']);
    soapDoc.set('owncloud_zimlet_server_path', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']);
    soapDoc.set('owncloud_zimlet_oc_folder', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']);
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
    else if (action === OwnCloudAction.GET_SHARES_FROM_FOLDER) {
      callback.run(JSON.parse(response[action]));
    }
    else if (action === OwnCloudAction.GET_SHARE_BY_ID) {
      callback.run(JSON.parse(response[action]));
    }
    else if (action === OwnCloudAction.CREATE_SHARE) {
      callback.run(JSON.parse(response[action]))
    }
    else if (action === OwnCloudAction.DELETE_SHARE_BY_ID) {
      callback.run(JSON.parse(response[action]))
    }
    else if (action === OwnCloudAction.UPDATE_SHARE) {
      callback.run(JSON.parse(response[action]))
    }
    else {
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
