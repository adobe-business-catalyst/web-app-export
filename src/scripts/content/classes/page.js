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
        this.injectScript(function(){
          try{
            if(window.authData && window.authData.hasOwnProperty('apiUrl')){ 
              var input= document.createElement('input'); 
              input.id='__siteApiBaseUrl'; 
              input.type='text'; 
              input.value = authData.apiUrl; 
              document.body.appendChild(input);
            }
          }catch(e){
            console.error(e)
          }
        }, document.body);
        // Get the api url and clean up after
        this.apiUrl = $('#__siteApiBaseUrl').val() ? "https://"+ $('#__siteApiBaseUrl').val() : null;
        $('#__siteApiBaseUrl').remove();
    },
    /*
    * Injects an script into content page.
    * @script content
    * @context document where the script will be injected, default the current document
    * @scriptArguments additional arguments as string
    * returns the script object.
    */
    injectScript:function( content, context, scriptArguments){
      var s = document.createElement('script')
          , context = context || document
          , scriptArguments = scriptArguments || "";
          
      s.textContent = '('+content+')('+scriptArguments+');';
      context.appendChild(s);
      s.parentNode.removeChild(s);
    },
    
    getContentType:function(){
      this.init();
      
      if( this.frame == null ){
        this.worker.postMessage({event:"Page:getContentType", data:null});
        return;
      }
      
      var url = this.frame.location.href;
      
      // Check if we are on the Web App edit/create page
      if( url && /Admin\/CustomContentType.aspx\?CustomContentID\=\-?\d/.test(url)){
        this.worker.postMessage({event:"Page:getContentType", data:Page.WEB_APP});
        return;
      }
      this.worker.postMessage({event:"Page:getContentType", data:null});
    },
    
    // Extract inputs from a container element
    extractInputs: function( from ){
      var result = {}
          , inputs
          , from = from || $(this.frameDoc)
          
      this.injectScript(function(){
        try{
          if (typeof (window.$telerik) != 'undefined') {
            if (window.$telerik.radControls && Telerik.Web.UI.RadEditor) {
              for (var i = 0, l = $telerik.radControls.length; i < l; i++) {
                var control = $telerik.radControls[i];
                if (Telerik.Web.UI.RadEditor.isInstanceOfType(control)) {
                  var editor = control;
                  var radInput = document.createElement('input');
                  radInput.type="text";
                  radInput.setAttribute('data-rad-id', editor.get_id())
                  radInput.className = 'injected-rad-editor-input';
                  radInput.value = editor.get_html();
                  document.body.appendChild(radInput);
                }
              }
            }
          }
        }catch(e){
          console.log(e)
        }
      }, this.frameDoc.body);
      
      inputs = $('input:visible, textarea:visible, select:visible', from).filter(':enabled');

      if( inputs.length == 0){
        return;
      }
      
      inputs.each(function(){
        if( $(this).is('input[type=text]') || $(this).is('textarea') || $(this).is('select')){
          if($(this).is('.injected-rad-editor-input')){
            if( !result.hasOwnProperty('rad')){
              result.rad={}
            }
            result.rad[$(this).attr('data-rad-id')] = $(this).val();
          }else{
            result[$(this).attr('id')] = $(this).val();
          }
        }
        
        if( $(this).is('input[type=checkbox]') || $(this).is('input[type=radio]')){
          result[$(this).attr('id')] = $(this).attr('checked') == 'checked' ? true : false;
        }
      });
      
      $('.injected-rad-editor-input', $(this.frameDoc)).remove()
      return result;
    },
    
    // Helper method. Set inputs value from imported data
    setInputs: function(data, context){
      var self = this;
      $.each(data, function(k, val){
        if(k == "rad"){
           // Set rad editor content if available
          $.each(data.rad, function(radId, radValue){
            self.injectScript(function(id, val){
              if(window.$find){
                var editor = $find(id);
                if(editor){
                  editor.set_html(val);
                }
              }
            }, self.frameDoc.body, "'"+radId+"','"+radValue.replace("'","\'")+"'");
          });
        }else{
          var id ="#"+k;
          
          if( $(id, context).is('input[type=text]') || $(id, context).is('textarea') || $(id, context).is('select')){
            $(id, context).val(val);
          }
          
          if( $(id, context).is('input[type=checkbox]') || $(id, context).is('input[type=radio]')){
            $(id, context).attr('checked', val)
          }
        }
      })
    }
});

