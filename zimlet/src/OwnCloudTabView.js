/**
 * @class
 * The attach mail tab view.
 *
 * @param	{DwtTabView} parent The tab view
 * @param	{hash} zimlet The zimlet
 * @param	{string} className The class name
 *
 * @extends	DwtTabViewPage
 */
OwnCloudTabView =
  function(parent, zimlet, className) {
    this.zimlet = zimlet;
    DwtComposite.call(this,parent,className,Dwt.STATIC_STYLE);
    var acct = appCtxt.multiAccounts ? appCtxt.getAppViewMgr().getCurrentView().getFromAccount() : appCtxt.getActiveAccount();
    if (this.prevAccount && (acct.id == this.prevAccount.id)) {
      this.setSize(Dwt.DEFAULT, "275");
      return;
    }
    this.prevAccount = acct;
    this._createHtml1(zimlet);
  };

OwnCloudTabView.prototype = new DwtComposite;
OwnCloudTabView.prototype.constructor = OwnCloudTabView;

OwnCloudTabView.prototype.toString =
  function() {
    return "OwnCloudTabView";
  };

/* Creates HTML for for the attach ownCloud tab UI.
 */
OwnCloudTabView.prototype._createHtml1 =
  function(zimlet) {
    try{
      var ZmAttachDialog = document.getElementsByClassName("ZmAttachDialog");
      ZmAttachDialog[0].style.width = "700px";

      var WindowInnerContainer = document.getElementsByClassName("WindowInnerContainer");
      WindowInnerContainer[0].style.width = "700px";

    } catch (err) { }

    if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
    {
      var prompt = '<span style="display:none" id=\'passpromptOuter\'>Your password is required for sharing links: <input type=\'password\' id=\'passprompt\'></span>';
    }
    else
    {
      var prompt = '<span style="display:none" id=\'passpromptOuter\'></span>';
    }

    if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_link_sharing']!=="false")
    {
      var disable_link_sharing = ' style="display:none" ';
    }
    else
    {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET",tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+"/ocs/zcs.php?path=havesession", false);
      xmlHttp.send( null );
      if(xmlHttp.response =='true')
      {
        var prompt = '<span style="display:none" id=\'passpromptOuter\'></span>';
      }
      var disable_link_sharing = '';
    }

    html = '<select ' + disable_link_sharing + ' onclick="if(this.value != \'attach\'){document.getElementById(\'passpromptOuter\').style.display = \'block\'; ownCloudZimlet.prototype.existingShares()} else { document.getElementById(\'passpromptOuter\').style.display = \'none\'; ownCloudZimlet.prototype.removeElementsByClass(\'ownCloudShareExists\');}" id="shareType"><option value="attach">Send as attachment</option><option value="1">Share as link</option></select> '+prompt+' <div style="width:650px; height: 255px; overflow-x: hidden; overflow-y: scroll; padding:2px; margin: 2px" id="davBrowser"></div><small><br></small>';
    this.setContent(html);

    var client = new davlib.DavClient();
    client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
    client.PROPFIND(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],  ownCloudZimlet.prototype.readFolderAsHTMLCallback, document.getElementById('davBrowser'), 1);
  };


/* Uploads the files.
 */
OwnCloudTabView.prototype._uploadFiles =
  function(attachmentDlg)
  {
    var ownCloudSelect = document.getElementsByClassName("ownCloudSelect");

    var oCreq = [];
    var req = "";
    var fileName = [];

    var ownCloudSelectSelected = [];
    var indexNew = 0;
    for (var index = 0; index < ownCloudSelect.length; index++) {
      if(ownCloudSelect[index].checked)
      {
        ownCloudSelectSelected[indexNew] = ownCloudSelect[index];
        indexNew++;
      }
    }
    ownCloudSelect = ownCloudSelectSelected;

    if(document.getElementById('shareType').value == 'attach')
    {
      var attBubble = document.getElementsByClassName("attBubbleContainer");
      attBubble[0].style.backgroundImage = 'url(\'/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/progressround.gif\')';
      attBubble[0].style.backgroundRepeat = "no-repeat";
      attBubble[0].style.backgroundPosition = "right";

      if (ownCloudSelect[0])
      {
        if(ownCloudSelect[0].checked)
        {
          ownCloudSelect[0].checked = false;
          oCreq[ownCloudSelect[0].value] = new XMLHttpRequest();
          oCreq[ownCloudSelect[0].value].open('GET', ownCloudSelect[0].value, true);
          oCreq[ownCloudSelect[0].value].setRequestHeader("Authorization", "Basic " + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + ":" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
          oCreq[ownCloudSelect[0].value].responseType = "blob";
          oCreq[ownCloudSelect[0].value].send('');

          oCreq[ownCloudSelect[0].value].onload = function(e)
          {
            //Patch for Internet Explorer that does not implement responseURL in XMLHttpRequest
            if (!this.responseURL)
            {
              this.responseURL = ownCloudSelect[0].value;
            }
            req = new XMLHttpRequest();
            fileName[this.responseURL] = this.responseURL.match(/(?:[^/][\d\w\.]+)+$/);
            fileName[this.responseURL] = decodeURI(fileName[this.responseURL][0]);
            req.open("POST", "/service/upload?fmt=extended,raw", true);
            req.setRequestHeader("Cache-Control", "no-cache");
            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            req.setRequestHeader("Content-Type",  "application/octet-stream" + ";");
            req.setRequestHeader("X-Zimbra-Csrf-Token", window.csrfToken);
            req.setRequestHeader("Content-Disposition", 'attachment; filename="'+ fileName[this.responseURL] + '"');
            req.onload = function(e)
            {
              var resp = eval("["+req.responseText+"]");
              var respObj = resp[2];
              var attId = "";
              for (var i = 0; i < respObj.length; i++)
              {
                if(respObj[i].aid != "undefined") {
                  OwnCloudTabView.attachment_ids.push(respObj[i].aid);
                }
              }
              OwnCloudTabView.prototype._uploadFiles();
            }
            req.send(this.response);
          };
        }
      }
      else
      {
        //If there are no more attachments to upload to Zimbra, attach them to the draft message
        var attachment_list = OwnCloudTabView.attachment_ids.join(",");
        var viewType = appCtxt.getCurrentViewType();
        if (viewType == ZmId.VIEW_COMPOSE)
        {
          var controller = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
          controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, attachment_list);
        }

        var attBubble = document.getElementsByClassName("attBubbleContainer");
        attBubble[0].style.backgroundImage = 'url(\'\')';
      }
    }
    else
    {
      //Create share links
      var attBubble = document.getElementsByClassName("attBubbleContainer");
      attBubble[0].style.backgroundImage = 'url(\'/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/progressround.gif\')';
      attBubble[0].style.backgroundRepeat = "no-repeat";
      attBubble[0].style.backgroundPosition = "right";

      if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
      {
        if(document.getElementById('passprompt'))
        {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = document.getElementById('passprompt').value;
        }
      }

      var jsonArray = [];
      for(var x=0; x < ownCloudSelect.length; x++)
      {
        jsonArray.push(unescape(ownCloudSelect[x].value.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"")));
      }
      var jsonString = JSON.stringify(jsonArray);
      var xmlHttp = new XMLHttpRequest();
      var password = ownCloudZimlet.prototype.pwgen();
      var composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode();
      if(composeMode == 'text/plain')
      {
        var sep = "rn";
      }
      else
      {
        var sep = "<br>";
      }

      xmlHttp.open("GET",tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+ "/ocs/zcs.php?proxy_location=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location'] + "&zcsuser="+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + "&zcspass=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] + "&path="+jsonString+"&shareType=3&password="+password+"&permissions="+document.getElementById('shareType').value+"&sep="+sep);
      xmlHttp.send( null );
      xmlHttp.onload = function(e)
      {
        var url = xmlHttp.response;
        var composeView = appCtxt.getCurrentView();
        //I hate the Zimbra compose controller
        var content = composeView.getHtmlEditor().getContent();
        if(content.indexOf('<hr id="') > 0)
        {
          content = content.replace('<hr id="',url + '<br><hr id="');
        }
        else if(content.indexOf('<div id="') > 0)
        {
          content = content.replace('<div id="',url + '<br><div id="');
        }
        else if(content.indexOf('</body') > 0)
        {
          content = content.replace('</body',url + '<br></body');
        }
        else if(content.indexOf('----') > 0)
        {
          content = content.replace('----',url + '\r\n----');
        }
        else
        {
          content = content + url + '';
        }
        composeView.getHtmlEditor().setContent(content);
        var attBubble = document.getElementsByClassName("attBubbleContainer");
        attBubble[0].style.backgroundImage = 'url(\'\')';
      }
    }
    //This function is called via the Attach Dialog once passing attachmentDlg,
    //subsequent calls when handling multiple selects don't pass attachmentDlg.
    try {
      attachmentDlg.popdown();
    } catch (err) {}
  };