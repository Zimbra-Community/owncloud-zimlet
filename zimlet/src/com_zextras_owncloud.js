function Com_zextras_owncloud() {}
Com_zextras_owncloud.prototype = new ZmZimletBase();
Com_zextras_owncloud.prototype.constructor = Com_zextras_owncloud;

Com_zextras_owncloud.INSTANCE = void 0;

Com_zextras_owncloud.prototype.init = function() {
  Com_zextras_owncloud.INSTANCE = this;
  this.davClient = new DavConnector();
  console.log('Hello ownCloud!');
};

Com_zextras_owncloud.prototype.getInstance = function() {
  return Com_zextras_owncloud.INSTANCE;
};

Com_zextras_owncloud.prototype.getDavConnector = function() {
  return this.davClient;
};
