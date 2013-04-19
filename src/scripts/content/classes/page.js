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

