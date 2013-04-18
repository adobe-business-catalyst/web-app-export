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
        // creates an input with this value, read it and deletes the input.
        var script = document.createElement("script");
        script.textContent = "if(authData && authData.hasOwnProperty('apiUrl')){ var input= document.createElement('input'); input.id='__siteApiBaseUrl'; input.type='text'; input.value = authData.apiUrl; document.body.appendChild(input);}";
        document.body.appendChild(script);
        
        // Read the api base url and delete the input.
        this.apiUrl = $('#__siteApiBaseUrl').val() ? "https://"+ $('#__siteApiBaseUrl').val() : null;
        $('#__siteApiBaseUrl').remove();
    },
    
    getContentType:function(){
        this.init();
        // Check if we are on the Web App edit/create page
        if(this.frame && this.frame.location.pathname.indexOf("/Admin/CustomContentType.aspx") > -1){
          this.worker.postMessage({event:"Page:getContentType", data:Page.WEB_APP});
        }else{
          this.worker.postMessage({event:"Page:getContentType", data:null});
        }
    },
    
    // Extract inputs from a container element
    extractInputs: function( from ){
      var result = {}
          , inputs = $('input:visible, textarea:visible, select:visible', from).filter(':enabled')
      
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
      })
    }
});

