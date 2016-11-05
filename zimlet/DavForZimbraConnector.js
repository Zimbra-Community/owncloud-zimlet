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
  var HANDLER_NAME = 'dav4zimbra';

  /**
   * Supported DAV for Zimbra Actions.
   * @const
   * @enum {string}
   */
  var DavForZimbraAction = {
    SEND_ITEM_TO_DAV: 'sendItemToDav',
    SEND_MAIL_ATTACHMENT_TO_DAV: 'sendMailAttachmentToDav'
  };

  var DavForZimbraShareType = {
    USER: 0,
    GROUP: 1,
    PUBLIC_LINK: 3,
    FEDERATED_CLOUD_SHARE: 6
  };

  var DavForZimbraSharePermission = {
    READ: 1,   // Default for public shares.
    UPDATE: 2,
    CREATE: 4,
    DELETE: 8,
    SHARE: 16,
    ALL: 31    // Default.
  };

  /**
   * OwnCloud connector client for OwnCloud server extension.
   * @constructor
   */
  function DavForZimbraConnector() {}
  DavForZimbraConnector.prototype = {};
  DavForZimbraConnector.prototype.constructor = DavForZimbraConnector;

  /**
   * Send an Item to Dav mount point.
   * @param {string} itemType
   * @param {number} itemId
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavForZimbraConnector.prototype.sendItemToDav = function(itemType, itemId, callback, errorCallback) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('itemType', itemType);
    soapDoc.set('itemId', itemId);
    DavForZimbraConnector._sendRequest(DavForZimbraAction.SEND_ITEM_TO_DAV, soapDoc, callback, errorCallback);
  };

  /**
   * Get all shares from the user.
   * @param {string} mid The message ID
   * @param {string} part The body part
   * @param {string} fileName The file name
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   */
  DavForZimbraConnector.prototype.sendMailAttachmentToDav = function(mid, part, fileName, callback, errorCallback, targetFolder) {
    var soapDoc = AjxSoapDoc.create(HANDLER_NAME, URN);
    soapDoc.set('mid', mid);
    soapDoc.set('part', part);
    soapDoc.set('fileName', fileName);
    if (targetFolder)
    {
       soapDoc.set('targetFolder', targetFolder);
    }
    DavForZimbraConnector._sendRequest(DavForZimbraAction.SEND_MAIL_ATTACHMENT_TO_DAV, soapDoc, callback, errorCallback);
  };

  /**
   * Send the request to the server soap extension.
   * @param {string} action
   * @param {AjxSoapDoc} soapDoc
   * @param {AjxCallback=} callback
   * @param {AjxCallback=} errorCallback
   * @private
   * @static
   */
  DavForZimbraConnector._sendRequest = function(action, soapDoc, callback, errorCallback) {
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
    soapDoc.set('owncloud_zimlet_password', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
    soapDoc.set('owncloud_zimlet_username', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']);
    soapDoc.set('owncloud_zimlet_server_name', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']);
    soapDoc.set('owncloud_zimlet_server_port', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port']);
    soapDoc.set('owncloud_zimlet_server_path', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']);
    soapDoc.set('owncloud_zimlet_oc_folder', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']);    
    var params = {
      soapDoc: soapDoc,
      asyncMode: true,
      callback: new AjxCallback(void 0, DavForZimbraConnector._parseResponse, [action, callback, errorCallback]),
      errorCallback: new AjxCallback(void 0, DavForZimbraConnector._handleError, [action, errorCallback])
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
  DavForZimbraConnector._parseResponse = function(action, callback, errorCallback, result) {
    var response = result.getResponse().response;
    if (result.isException() && !!errorCallback) {
      errorCallback.run(result);
      return void 0;
    }
    if (!!response.error) {
      errorCallback.run(JSON.parse(response.error));
      return void 0;
    }

    if (action === DavForZimbraAction.SEND_ITEM_TO_DAV) {
      callback.run(response[action]);
    }
    else if (action === DavForZimbraAction.SEND_MAIL_ATTACHMENT_TO_DAV) {
      callback.run(response[action]);
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
  DavForZimbraConnector._handleError = function(action, errorCallback, error) {
    if (!!errorCallback) {
      errorCallback.run(error);
    }
  };

  /* Expose these object to the scope */
  context.DavForZimbraConnector = DavForZimbraConnector;
  context.DavForZimbraShareType = DavForZimbraShareType;
  context.DavForZimbraSharePermission = DavForZimbraSharePermission;
})(this);
