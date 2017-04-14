/*
Copyright (C) 2016  Barry de Graaff

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.

*/

function tk_barrydegraaff_docconvert_HandlerObject() {
   tk_barrydegraaff_docconvert_HandlerObject.settings = {};
};

tk_barrydegraaff_docconvert_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_docconvert_HandlerObject.prototype.constructor = tk_barrydegraaff_docconvert_HandlerObject;

tk_barrydegraaff_docconvert_HandlerObject.prototype.toString =
function() {
   return "tk_barrydegraaff_docconvert_HandlerObject";
};

var docConvertZimlet = tk_barrydegraaff_docconvert_HandlerObject;

docConvertZimlet.prototype.init = function () {
	if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
		AjxPackage.require({name:"MailCore", callback:new AjxCallback(this, this.addAttachmentHandler)});
	}
  
};

docConvertZimlet.prototype.addAttachmentHandler = function(mime)
{
	this._msgController = AjxDispatcher.run("GetMsgController");
	var viewType = appCtxt.getViewTypeFromId(ZmId.VIEW_MSG);
	this._msgController._initializeView(viewType);

   //Load 1000 mime-types
   docConvertZimlet.prototype.mime();
   docConvertZimlet.mime.forEach(function(mime) 
   {
      var MISSMIME = 'docConvertZimlet'+mime.replace("/","_");
      ZmMimeTable.MISSMIME=mime;
      ZmMimeTable._table[ZmMimeTable.MISSMIME]={desc:ZmMsg.unknownBinaryType,image:"UnknownDoc",imageLarge:"UnknownDoc_48"};      
   });

	for (var mimeType in ZmMimeTable._table) {
      if(      
      (mimeType == 'application/vnd.ms-excel') ||
      (mimeType == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
      (mimeType == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      (mimeType == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
      (mimeType == 'application/vnd.ms-powerpoint') ||
      (mimeType == 'application/msword') ||
      (mimeType == 'application/vnd.oasis.opendocument.presentation') ||
      (mimeType == 'application/vnd.oasis.opendocument.spreadsheet') ||
      (mimeType == 'application/vnd.oasis.opendocument.text'))
      {
         this._msgController._listView[viewType].addAttachmentLinkHandler(mimeType,"PDF",this.addDocConvertLink);
      }
	}
};

docConvertZimlet.prototype.addDocConvertLink = 
function(attachment) {
	var html =
			"<a href='#' class='AttLink' style='text-decoration:underline;' " +
					"onClick=\"docConvertZimlet.prototype.saveAttachment('" + attachment.label + "','" + attachment.url + "')\">"+
					"PDF" +
					"</a>";
               
	return html;
};

/* status method show a Zimbra status message
 * */
docConvertZimlet.prototype.status = function(text, type) {
   var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
   appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
}; 

docConvertZimlet.prototype.saveAttachment = 
function(name, url) {           
   docConvertZimlet.prototype.status(ZmMsg.loading, ZmStatusView.LEVEL_INFO);

   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", url, true );        
   xmlHttp.responseType = "blob";
   xmlHttp.send( null );
  
   xmlHttp.onload = function(e) 
   {
      var formData = new FormData();
      formData.append("myFile", xmlHttp.response);

      var xhr = new XMLHttpRequest();
      xhr.open("POST", '/service/extension/docconvert/?extension='+name.split('.').pop()+'&name='+encodeURIComponent(name));
      xhr.responseType = "blob";
      xhr.send(formData);
      xhr.onload = function(e) 
      {
         docConvertZimlet.prototype.downloadBlob(name+'.pdf', 'application/pdf', xhr.response);
      }
   };        
};

docConvertZimlet.prototype.downloadBlob = function (filename, type, blob) {
   if (!window.navigator.msSaveOrOpenBlob)
   {       
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      a.click();     
   }
   else
   {
      window.navigator.msSaveOrOpenBlob(blob, filename);
   }
}
