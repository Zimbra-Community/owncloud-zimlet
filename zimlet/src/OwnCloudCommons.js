function OwnCloudCommons(davConnector, ownCloudConnector, davForZimbraConnector) {
  this._davConnector = davConnector;
  this._ownCloudConnector = ownCloudConnector;
  this._davForZimbraConnector = davForZimbraConnector;

  this._waitingDialog = null;
}

OwnCloudCommons.prototype._getWaitingDialog = function() {
  if (this._waitingDialog === null) {
    this._waitingDialog = new DwtMessageDialog({
      parent: appCtxt.getShell(),
      buttons: [DwtDialog.NO_BUTTONS]
    });
  }
  return this._waitingDialog;
};

OwnCloudCommons.prototype.getAttachmentLinks = function(davResources, callback) {
  this._getWaitingDialog().popup();

  this.getAttachments(davResources, [], callback);
};

OwnCloudCommons.prototype.getAttachments = function(resourcesToLink, resourcesToAttach, callback, sharePassword) {
  this._getWaitingDialog().popup();

  var /** @type {string[]} */ links = [],
    /** @type {number[]} */ ids = [];

  this._getFirstLink(
    resourcesToLink,
    links,
    new AjxCallback(
      this,
      this._onUploadOrAttachFinished,
      [resourcesToLink, resourcesToLink.length, links, resourcesToAttach, resourcesToAttach.length, ids, callback]
    ),
    sharePassword
  );
};

/**
 * Process the resources array, consuming an item.
 * @param {DavResource[]} resources
 * @param {string[]} links
 * @param {AjxCallback} callback
 * @private
 */
OwnCloudCommons.prototype._getFirstLink = function(resources, links, callback, sharePassword) {
  if (resources.length < 1) {
    if (!!callback) {
      callback.run();
    }
    return;
  }

  this._getWaitingDialog().setMessage(
    "Creating link(s) to attach to the message, please wait ... " + links.length  + " / " + (links.length + resources.length),
    DwtMessageDialog.INFO_STYLE,
    "Retrieving attachments from WebDAV"
  );

  var resource = resources.shift(),
    internalCallback = new AjxCallback(
      this,
      this._createShareCbk,
      [resource, resources, links, callback, sharePassword]
    );

  this._ownCloudConnector.createShare(
    resource.getHref(),
    DavForZimbraShareType.PUBLIC_LINK,
    void 0,
    false,
    sharePassword ? sharePassword : void 0,
    DavForZimbraSharePermission.READ,
    internalCallback
  );
};

/**
 * Process the resources array, consuming an item.
 * @param {DavResource[]} resources
 * @param {number[]} ids
 * @param {AjxCallback} callback
 * @private
 */
OwnCloudCommons.prototype._getFirstResource = function(resources, ids, callback) {
  if (resources.length < 1) {
    if (!!callback) {
      callback.run(ids);
    }
    return;
  }

  this._getWaitingDialog().setMessage(
    "Attaching file(s) to the message, please wait ... " + ids.length + " / " + (resources.length + ids.length),
    DwtMessageDialog.INFO_STYLE,
    "Retrieving attachments from ownCloud"
  );

  var resource = resources.shift(),
    internalCallback = new AjxCallback(
      this,
      this._getResourceCbk,
      [resource, resources, ids, callback]
    );

  this._davConnector.get(
    resource.getHref(),
    internalCallback
  );
};

/**
 * Handle the data received from the ownCloud installation about the shared path.
 * @param {DavResource} resource
 * @param {DavResource[]} resources
 * @param {string[]} links
 * @param {AjxCallback} callback
 * @param {{}} data
 * @private
 */
OwnCloudCommons.prototype._createShareCbk = function(resource, resources, links, callback, sharePassword, data) {
  links.push({
    name: resource.getName(),
    link: data.url
  });
  this._getFirstLink(resources, links, callback, sharePassword);
};

/**
 * When a resource is retrieved, send it to zimbra as attachment.
 * 
 * This method should be replaced, as well as `get` method from DavSoapConnector.java as
 * this approach sends the file to attach from DAV server to the Client and then to the Zimbra server. 
 * 
 * Suggested solution is to call saveUpload method from FileUploadServlet.java from Zimbra Source or make 
 * a wrapper for this in OpenZAL and to send the attachment from DAV server, directly to Zimbra and only 
 * send the ID of the attachment to the client for saveDraft.
 * 
 * @param {DavResource} resource
 * @param {DavResource[]} resources
 * @param {number[]} ids
 * @param {AjxCallback} callback
 * @param {string} data
 * @private
 */
OwnCloudCommons.prototype._getResourceCbk = function(resource, resources, ids, callback, data) {
  var req = new XMLHttpRequest();
  if (!req.responseURL)
  {
    req.responseURL = '/service/upload?fmt=extended,raw';
  }
  req.open('POST', '/service/upload?fmt=extended,raw', true);
  req.setRequestHeader('Cache-Control', 'no-cache');
  req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  req.setRequestHeader('Content-Type',  'application/octet-stream' + ';');
  req.setRequestHeader('X-Zimbra-Csrf-Token', window.csrfToken);
  req.setRequestHeader('Content-Disposition', 'attachment; filename="'+ resource.getName() + '";');
  req.onload = (function(_this, resources, ids, callback) {
    return function(result) {
      var resp = eval('[' + this.responseText + ']'),
        respObj;
      respObj = resp[2];
      if (!!(respObj[0].aid)) { ids.push(respObj[0].aid); }
      // ew also have these fields: ct (content type), filename, s(size)
      _this._getFirstResource(resources, ids, callback);
    };
  }(this, resources, ids, callback));

  var dataBin = OwnCloudCommons.prototype.base64DecToArr(data);
  var blob = new Blob([dataBin], { type: 'octet/stream' });
  req.send(blob);
};

/** Array of bytes to base64 string decoding
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding$revision/773109 MDN Base64 encoding and decoding}.
*/
OwnCloudCommons.prototype.b64ToUint6 = function (nChr) {
  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;
}

/** Base64 decode binary safe. 
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding$revision/773109 MDN Base64 encoding and decoding}.
 * @param {string} nChr - base64 encoded string
*/
OwnCloudCommons.prototype.base64DecToArr = function (sBase64, nBlocksSize) {
  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= OwnCloudCommons.prototype.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;
    }
  }
  return taBytes;
}

/**
 * Callback invoked when the system has finished the upload/link of the files.
 * @param {DavResource[]} resourcesToLink
 * @param {number} resourcesCountToLink
 * @param {string[]} idsToLink IDs of the objects linked.
 * @param {DavResource[]} resourcesToAttach
 * @param {number} resourcesCountToAttach
 * @param {string[]} idsToAttach IDs of the objects attached.
 * @param {AjxCallback} callback Callback to call when the process is finished.
 * @private
 */
OwnCloudCommons.prototype._onUploadOrAttachFinished = function(
  resourcesToLink,
  resourcesCountToLink,
  idsToLink,
  resourcesToAttach,
  resourcesCountToAttach,
  idsToAttach,
  callback
) {
  var internalCallback = new AjxCallback(
      this,
      this._onUploadOrAttachFinished,
      [resourcesToLink, resourcesCountToLink, idsToLink, resourcesToAttach, resourcesCountToAttach, idsToAttach, callback]
    );

  if (resourcesToLink.length > 0) {
    // Attach files and forlders as links.
    this._getFirstLink(
      resourcesToLink,
      resourcesToLink.length,
      internalCallback
    );
  } else if(resourcesToAttach.length > 0) {
    // Attach files as standard attachments.
    this._getFirstResource(
      resourcesToAttach,
      idsToAttach,
      internalCallback
    );
  } else {
    this._getWaitingDialog().popdown();
    if (typeof callback !== "undefined") {
      callback.run(idsToLink, idsToAttach);
    }
  }
};
