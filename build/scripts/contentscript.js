var Page = klass(function(worker){
    this.worker = worker;
});

/*
* Statics
*/
Page.statics({
  WEB_APP:"WebApp"
});

Page.methods({
    init:function(){
        var self = this;
        if( !document.getElementsByTagName('iframe').length )
          return;
          
        this.frame = document.getElementsByTagName('iframe')[0].contentWindow
        this.frameDoc = this.frame.document
        
        // Extract auth token from the cookie
        $.cookie.raw = true;
        this.authToken = $.cookie('siteAuthToken'); 
        
        // Extract the siteID from partner portal link :D
        var urlParams = unserialize($('#PPLink', $(this.frameDoc)).attr("href"));
        if(urlParams.hasOwnProperty("ASID"))
          this.siteID = urlParams.ASID
        
        // Hack. Retrieve the API base url.
        // Inject an script into the page, that reads the authData.apiUrl var and
        // creates an input with this value, reads it and deletes the input.
        
        this.injectScript("scripts/page/get_api_url.js", document.body, function(){
          // Read the api base url and delete the input.
          self.apiUrl = $('#__siteApiBaseUrl').val() ? "https://"+ $('#__siteApiBaseUrl').val() : null;
          $('#__siteApiBaseUrl').remove();
        });
        
    },
    /*
    * Injects an script into content page.
    * @scriptUrl script url
    * @context document where the script will be injected, default the current document
    * @callback callback method to be run after the script is injected
    * @callbackArguments additional callback method params
    */
    injectScript:function(scriptUrl, context, callback, callbackArguments){
      var s = document.createElement('script')
          , self = this
          , context = context || document
          , callbackArguments = callbackArguments || [];
          
      s.src = chrome.extension.getURL(scriptUrl);
      s.onload = function(){
        if(callback)
          callback.apply(self, callbackArguments);
        // Remove the injected script  
        this.parentNode.removeChild(this);
      }
      context.appendChild(s);
    },
    
    getContentType:function(){
        this.init();
        // Check if we are on the Web App edit/create page
        if(this.frame && this.frame.location && this.frame.location.pathname.indexOf("/Admin/CustomContentType.aspx") > -1){
          this.worker.postMessage({event:"Page:getContentType", data:Page.WEB_APP});
        }else{
          this.worker.postMessage({event:"Page:getContentType", data:null});
        }
    },
    
    // Extract inputs from a container element
    extractInputs: function( from ){
      var result = {}
          , inputs
      
      // Inject script to extract rad editor contents
      this.injectScript("scripts/page/get_rad_controls.js", this.frameDoc.body);
        
      inputs = $('input:visible, textarea:visible, select:visible, input.injected-rad-editor-input', from).filter(':enabled');
      console.log($('input.injected-rad-editor-input').val());
      
      if( inputs.length == 0){
        return;
      }
      
      inputs.each(function(){
        if( $(this).is('input[type=text]') || $(this).is('textarea') || $(this).is('select')){
          result[$(this).attr('id')] = $(this).val();
        }
        
        if( $(this).is('input[type=checkbox]') || $(this).is('input[type=radio]')){
          result[$(this).attr('id')] = $(this).attr('checked') == 'checked' ? true : false;
        }
        
      });
      
      
      return result;
    },
    
    // Helper method. Set inputs value from imported data
    setInputs: function(data, context){
      $.each(data, function(k, val){
        var id ="#"+k;
        
        if( $(id, context).is('input[type=text]') || $(id, context).is('textarea') || $(id, context).is('select')){
          $(id, context).val(val);
        }
        
        if( $(id, context).is('input[type=checkbox]') || $(id, context).is('input[type=radio]')){
          $(id, context).attr('checked', val)
        }
        
        // Set rad editor content if available
        
      })
    }
});


var SecureZone = Page.extend(function(worker){

})

var WebApp = Page.extend(function(worker){

})

WebApp.methods({
  
  // Get WebApp info
  getInfo:function(){
    this.init();
    var locationParams = unserialize(this.frame.location.search)
      , response = {
        name: $('#main h1 span').text() || "",
        id:locationParams.CustomContentID || -1
      }
      
    this.worker.postMessage({event:"WebApp:getInfo", data:response});
  },
  
  // Navigate to specified tab
  navigate: function(tabIndex){
    var tabs = $('#hybridSubmenu a', $(this.frameDoc))
    if(tabs[tabIndex] != undefined)
      tabs[tabIndex].click()
  },
  
  /******************************************************************************************************************************************
  * 
  * Export web app
  *
  *******************************************************************************************************************************************/
  exportSettings:function(){
    this.init();
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Exporting web app "+$('#main h1 span').text()
      }
    });
    
    if($('#hybridSubmenu li', $(this.frameDoc)).index($('#hybridSubmenu li.active', $(this.frameDoc)))==0){
      this.exportDetailsTab();
    }else{
      // Navigate to the Details tab
      $('iframe:first').bind('load', $.proxy(this.exportDetailsTab, this));
      this.navigate(0);
    }
  },
  
  /*
  * Export Details tab
  */
  
  exportDetailsTab:function(){
    this.init();
    $('iframe:first').unbind('load');
    
    var data = {
      details:this.extractInputs($('.hybridForm', $(this.frameDoc))),
      fields:{},
      layout:{},
      autoresponder:{}
    }
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Exporting web app "+$('#main h1 span').text()+" details tab"
      }
    });
    // All done, navigate to the Fields tab
    $('iframe:first').bind('load', data, $.proxy(this.exportFieldsTab, this));
    this.navigate(1);
  },

  /*
  *   Export Fields tab
  *
  */

  exportFieldsTab: function(e){
    this.init();
    $('iframe:first').unbind('load');
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Exporting web app "+$('#main h1 span').text()+" fields tab"
      }
    });
    
    var self = this
        , data = e.data
        , context = $(this.frameDoc)
        , fields = []
        , i = 0
    
    var selectNextField = function(){
      // Process Layout tab if it is the last field
      if($('#ctl00_cp_uc_listFormItems option:selected', context).is($('#ctl00_cp_uc_listFormItems option:last', context))){
        data.fields = fields;
        $('iframe:first').bind('load', data, $.proxy(self.exportLayoutTab, self));
        self.navigate(2);  
      }
      
      // Extract fields info
      var inputs = self.extractInputs($('#ctl00_cp_uc_panelFieldDetails', context)); 
      if(inputs)
        fields.push(inputs)    
      
      // This is a hack. Without this change, it will raise an error. 
      // Change the onChange attribute. This is the correct way toa attach an setTimeout handler
      $('#ctl00_cp_uc_listFormItems', context).attr('onchange', "javascript:setTimeout(function(){__doPostBack('ctl00$cp$uc$listFormItems','');}, 0)")    
      
      // Check if it is any field selected
      if($('#ctl00_cp_uc_listFormItems option:selected', context).length){
        $('#ctl00_cp_uc_listFormItems', context).
          val($('#ctl00_cp_uc_listFormItems option:selected', context).next().attr('value')).
          trigger('change')
      }else{
        // Select the firs field
        $('#ctl00_cp_uc_listFormItems', context).
          val($('#ctl00_cp_uc_listFormItems option:first', context).attr('value')).
          trigger('change')
      }
    }

    context.on('DOMSubtreeModified','#ctl00_cp_uc_panelFieldDetails', function(e){
      i++;
      if(i == 2){
        i=0;
        selectNextField();
      }
    });
    selectNextField();
  },
  
  /*
  *  Export layout tab
  */
  
  exportLayoutTab:function(e){
    this.init();
    $('iframe:first').unbind('load');
    
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Exporting web app "+$('#main h1 span').text()+" layout tab"
      }
    });
    
    var data = e.data
        , self = this
        , baseURL = self.apiUrl+"/api/v2/admin/sites/"+self.siteID+"/storage/Layouts/WebApps/"+encodeURIComponent($('#main h1 span').text())
        , getTemplate;
    
    $('iframe:first').bind('load',data, $.proxy(this.exportAutoresponderTab, this));
    if( self.apiUrl == undefined || self.apiUrl == ""){
      // Skip the layout export if API_BASE_URL was not detected
      self.navigate(3);
    }
    
    getTemplate = function(tpl, cb){
      $.ajax({
        url: baseURL+"/"+tpl+".html",
        headers:{ Authorization:self.authToken },
        
        success:function(response){
          data.layout[tpl] = response
          cb()
        },
        error:function(){
          self.worker.postMessage({event:"Page:status", data:{text:"Exporting "+tpl+" layout failed!.", css:"alert-error" }});
          cb();
        }
      });
    }
    
    // Get templates
    self.worker.postMessage({event:"Page:status", data:{text:"Exporting list layout" }});
    
    getTemplate("list", function(){
      self.worker.postMessage({event:"Page:status", data:{text:"Exporting detail layout" }});
      getTemplate("detail", function(){
        self.worker.postMessage({event:"Page:status", data:{text:"Exporting edit layout" }});
        getTemplate("edit", function(){
          self.navigate(3);
        })
      })
    })
        
  },
  
  /*
  *  Export autoresponder tab
  */
  exportAutoresponderTab:function(e){
    this.init();
    $('iframe:first').unbind('load');
    var data = e.data;
    data.autoresponder = this.extractInputs($('.main', $(this.frameDoc)));
    // TODO: Include rad editor controls to extractInputs method
    data.autoresponder['ctl00_cp_uc_reContentHiddenTextarea'] = $('#ctl00_cp_uc_reContentHiddenTextarea', $(this.frameDoc)).val();
    
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:$('#main h1 span').text() +" exported successfully! Copy the export data and import it into a new website.", 
        css:"alert-success"
      }
    });
    
    this.worker.postMessage({event:"WebApp:exportSettings", data:data});
  },
  
  /******************************************************************************************************************************************
  *
  * Import web app
  *
  *******************************************************************************************************************************************/
  importSettings: function(data){
    this.init();
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Importing web app settings started."
      }
    });
    
    $('iframe:first').unbind('load');
    
    if($('#hybridSubmenu li', $(this.frameDoc)).index($('#hybridSubmenu li.active', $(this.frameDoc)))==0){
      this.importDetailsTab(null, data);
    }else{
      // Navigate to the Details tab
      $('iframe:first').bind('load', data, $.proxy( this.importDetailsTab, this));
      this.navigate(0);
    }
    
  },
  
  importDetailsTab:function(e, data){
    this.init();
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Importing web app details."
      }
    });
    $('iframe:first').unbind('load');
    
    try{
      var settings = {}
          , context = $('.hybridForm', $(this.frameDoc))
          , imported = false
          , self = this;
      
      if( e && e.data )
        settings = JSON.parse(e.data);
      
      if(data)
        settings = JSON.parse(data);
      
      this.setInputs(settings.details, context);
      
      $('iframe:first').bind('load', settings, $.proxy(this.importFieldsTab, this));
      
      $(this.frameDoc).on('DOMSubtreeModified','.footerbuttons', function(e){
        self.navigate(1);
      });
        
      // Click on the "Save" button
      $('#ctl00_cp_btnSubmit', $(this.frameDoc)).trigger('click');
    }catch(e){
      this.worker.postMessage({
        event:"Page:status", 
        data:{
          text:"Importing web app details failed!", 
          css:"alert-error"
        }
      });
    }
    
  },
  
  /*
  * Import fields tab
  */
  
  addField: function(e){
    this.init();
    $('iframe:first').unbind('load');
    
    if($(e.target).is('#systemNotificationQueue') && $('#systemNotificationQueue').text() != ""){
      return;
    }
    
    var data = e.data
        ,self = this
        ,context = $(this.frameDoc)
        ,field
        ,locationParams = unserialize(this.frame.location.search)
    
    // Navigate to layout tab if there are any fields
    if( data.fields.length == 0 ){
      $('iframe:first').bind('load', data, $.proxy(this.importLayoutTab, this));
      setTimeout($.proxy(this.navigate, this), 1000, 2)
      return;
    }
    
    fieldData = data.fields.shift();
    this.setInputs(fieldData, context);
    
    $('#ctl00_cp_uc_btnAdd', $(self.frameDoc)).trigger('click');
    
  },
  
  importFieldsTab:function(e){
    this.init();
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Importing web app fields."
      }
    });
    $('iframe:first').unbind('load');
    
    var data = e.data
        ,self = this
        ,context = $(this.frameDoc)
    
    // Navigate to layout tab if there are any fields
    if( !data.fields || data.fields.length == 0 ){
      $('iframe:first').bind('load', data, $.proxy(this.importLayoutTab, this));
      this.navigate(2);
      return;
    }
    
    $('iframe:first').bind('load', data, $.proxy( this.addField, this ));
    $('#systemNotificationQueue').bind('DOMSubtreeModified', data, $.proxy( this.addField, this ));
    $('#ctl00_cp_uc_btnNew', $(this.frameDoc)).trigger('click');
  },
  
  importLayoutTab:function(e){
    this.init();
    this.worker.postMessage({event:"Page:status", data:{ text:"Importing web app layouts." }});
    
    $('iframe:first').unbind('load');
    $('#systemNotificationQueue').unbind('DOMSubtreeModified');
    
    var data = e.data
        , self = this
        , context = $(this.frameDoc)
        , baseURL = self.apiUrl+"/api/v2/admin/sites/"+self.siteID+"/storage/Layouts/WebApps/"+encodeURIComponent($('#main h1 span').text())
        , saveTemplate;
        
    $('iframe:first').bind('load',data, $.proxy(this.importAutoresponderTab, this));
    
    if( self.apiUrl == undefined || self.apiUrl == "" ){
      // Skip the layout import if API_BASE_URL was not detected
      self.navigate(3);
    }
    
    saveTemplate = function(tpl, cb){
        $.ajax({
        url: baseURL+"/"+tpl+".html",
        headers:{ Authorization:self.authToken },
        method:"PUT",
        processData:false,
        contentType:"application/octet-stream",
        data:data.layout[tpl],
        success: cb
      });
    }
    
    // Save templates
    self.worker.postMessage({event:"Page:status", data:{text:"Importing list layout" }});
    saveTemplate("list", function(){
      self.worker.postMessage({event:"Page:status", data:{text:"Importing detail layout" }});
      saveTemplate("detail", function(){
        self.worker.postMessage({event:"Page:status", data:{text:"Importing edit layout" }});
        saveTemplate("edit", function(){
          self.navigate(3);
        })
      })
    })
        
  },
  setEditorContent:function(editorID, content, doc){
    var script = document.createElement("script")
        , escapedContent = content ? content.replace("'", "\'") :"";
    
    script.textContent = "if(window.$find){"+
    "var editor=$find('"+editorID+"')"+
    " if(editor){"+
    "   editor.set_html('"+escapedContent+"')"+
    " }"+
    "}";
    doc.body.appendChild(script);
  },
  
  importAutoresponderTab:function(e){
    this.init();
    $('iframe:first').unbind('load');
    
    var data = e.data
        ,self = this
        ,context = $(this.frameDoc)
        
    if(!data.autoresponder){
      this.worker.postMessage({
        event:"Page:status", 
        data:{
          text:"Web app imported successfully!",
          css: "alert-success"
        }
      });  
      this.worker.postMessage({ event:"WebApp:importSettings" });
      return;
    }
    
    this.setInputs(data.autoresponder, context);
    this.setEditorContent('ctl00_cp_uc_re', data.autoresponder['ctl00_cp_uc_reContentHiddenTextarea'], this.frameDoc);
    $('#ctl00_cp_uc_btnSubmit', context).trigger('click');
  
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Web app imported successfully!",
        css: "alert-success"
      }
    });  
    this.worker.postMessage({ event:"WebApp:importSettings" });
  }
});


// Helper function to extract query string params
function unserialize(p){
  if(!p) return {};
  var ret = {},
      seg = p.replace(/^\?/,'').split('&'),
      len = seg.length, i = 0, s;
  for (;i<len;i++) {
      if (!seg[i]) { continue; }
      s = seg[i].split('=');
      ret[s[0]] = s[1];
  }
  return ret;
}

// And the magic begins...
$(document).ready(function(){
  var worker = null;
  
  // Dispatch messages
  var onMessage = function(msg){
    // The message dispatcher
    // msg.action is in the form of className:methodName (Eg. Page:getContentType)
    if( !msg.action )
      return;
    
    var info = msg.action.split(":");
    if(info.length != 2)
      return;
    
    var className = info[0]
        , methodName = info[1]
    
    // If class not exists exit.
    if( !window[className])
      return;
    
    // Create an instance of class name
    
    var controller = new window[className](worker);
    if(controller[methodName] != undefined && typeof controller[methodName] === 'function'){
      controller[methodName].apply(controller, msg.argv);
    }
  }
  
  // When connected, listen for messages
  var onConnect = function(port){
    if(port.name == "BC"){
      worker = port;
      worker.onMessage.addListener(onMessage);
    }
  }
  chrome.runtime.onConnect.addListener(onConnect);
  
});


