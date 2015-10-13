function DavConnector() {}
DavConnector.prototype = {};
DavConnector.prototype.constructor = DavConnector;

DavConnector.prototype.get = function(path, callback, errorCallback) {
  var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount');
  soapDoc.set('action', 'GET');
  soapDoc.set('path', path);
  DavConnector.sendRequest(
    soapDoc,
    callback,
    errorCallback
  );
};

DavConnector.prototype.propfind = function(path, callback, errorCallback) {
  var soapDoc = AjxSoapDoc.create('davSoapConnector', 'urn:zimbraAccount');
  soapDoc.set('action', 'PROPFIND');
  soapDoc.set('path', path);
  soapDoc.set('depth', 1);
  DavConnector.sendRequest(
    soapDoc,
    callback,
    errorCallback
  );
};

DavConnector.sendRequest = function(soapDoc, callback, errorCallback) {
  var params = {
    soapDoc: soapDoc,
    asyncMode: true,
    callback: callback,
    errorCallback: errorCallback
  };

  appCtxt.getAppController().sendRequest(params);
};
