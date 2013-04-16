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
        , baseURL = Page.API_BASE_URL+"/api/v2/admin/sites/"+self.siteID+"/storage/Layouts/WebApps/"+encodeURIComponent($('#main h1 span').text())
        , getTemplate;
    
    $('iframe:first').bind('load',data, $.proxy(this.exportAutoresponderTab, this));
    
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
        ,self = this
        ,context = $(this.frameDoc)
        , baseURL = Page.API_BASE_URL+"/api/v2/admin/sites/"+self.siteID+"/storage/Layouts/WebApps/"+encodeURIComponent($('#main h1 span').text())
        , saveTemplate;
        
    $('iframe:first').bind('load',data, $.proxy(this.importAutoresponderTab, this));
    
    saveTemplate = function(tpl, cb){
        $.ajax({
        url: baseURL+"/"+tpl+".html",
        headers:{ Authorization:self.authToken },
        method:"PUT",
        processData:false,
        contentType:"application/octet-stream",
        data:data.layout[tpl],
        success:function(response){
          cb()
        }
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
  
  importAutoresponderTab:function(e){
    this.init();
    $('iframe:first').unbind('load');
    
    var data = e.data
        ,self = this
        ,context = $(this.frameDoc)
        
    if( data.autoresponder){
      this.setInputs(data.autoresponder, context);
      $('#ctl00_cp_uc_btnSubmit', context).trigger('click');
    }
    
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

