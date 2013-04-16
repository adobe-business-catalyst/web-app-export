var Page = klass(function(worker){
    this.worker = worker;
});

/*
* Statics
*/
Page.statics({
  WEB_APP:"WebApp",
  API_BASE_URL: "https://api-bc.testsecure.com" 
});

Page.methods({
    init:function(){
        if(document.getElementsByTagName('iframe').length){
          this.frame = document.getElementsByTagName('iframe')[0].contentWindow
          this.frameDoc = this.frame.document
          
          // Extract auth token from the cookie
          this.authToken = $.cookie('siteAuthToken'); 
          
          // Extract site ID from any of ANONID_FS<siteID>, GEID<siteID>, ASESSID<siteID> cookies 
          var matches = /ANONID_FS([0-9]+)|GEID([0-9]+)|ASESSID([0-9]+)/g.exec(document.cookie);
          if(matches && matches.length){
            this.siteID = matches[1];
          }
        }
    },
    getContentType:function(){
        this.init();
        // Check if we are on the Web App edit/create page
        if(this.frame && this.frame.location.pathname.indexOf("/Admin/CustomContentType.aspx") > -1){
          this.worker.postMessage({event:"Page:getContentType", data:Page.WEB_APP});
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

