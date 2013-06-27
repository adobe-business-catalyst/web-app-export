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
      name: $('#main h1 span').text(),
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
      
      // Remove the doPostBack callback on dropdown change. We will do this manually later.
      $('#ctl00_cp_uc_listFormItems', context).attr('onchange', "");
      
      // Check if it is any field selected
      if($('#ctl00_cp_uc_listFormItems option:selected', context).length){
        $('#ctl00_cp_uc_listFormItems', context).
          val($('#ctl00_cp_uc_listFormItems option:selected', context).next().attr('value'))
      }else{
        // Select the first field
        $('#ctl00_cp_uc_listFormItems', context).
          val($('#ctl00_cp_uc_listFormItems option:first', context).attr('value'))
      }
      
      // Do the postback
      self.injectScript(function(){
        setTimeout(function(){
          __doPostBack('ctl00$cp$uc$listFormItems','');
        },0);
      }, self.frameDoc.body)
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
    var data = e.data
       ,self = this;
       
    data.autoresponder = this.extractInputs($(this.frameDoc));
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:$('#main h1 span').text() +" Web App settings were stored to local storage. You can now switch to a different site and use the import functionality.", 
        css:"alert-success"
      }
    });
    chrome.storage.local.set({webappdata:data}, function(){
      self.worker.postMessage({event:"WebApp:exportSettings", data:data});
    })
    
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
        text:"Importing "+(data.name||"")+"web app settings started."
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
      
      // Reset all visible inputs
      $('input[type=text]:visible, textarea:visible, select:visible', context).val(null)
      $('input[type=checkbox]:visible, input[type=radio]:visible', context).attr('checked', false);   
      
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
    
    if($(e.target).is('#systemNotificationQueue') && $('#systemNotificationQueue').text() != ""){
      $('#systemNotificationQueue').html("");
      return;
    }
    
    $('iframe:first').unbind('load');

    var data = e.data
        ,self = this
        ,context = $(this.frameDoc)
        ,field
        ,locationParams = unserialize(this.frame.location.search);
    
    // Navigate to layout tab if there are any fields
    if( data.fields.length == 0 ){
      $('iframe:first').bind('load', data, $.proxy(this.importLayoutTab, this));
      this.navigate(2);
      return;
    }
    
    fieldData = data.fields.shift();
    while( fieldData && fieldData.hasOwnProperty('ctl00_cp_uc_txtItemName') && $('#ctl00_cp_uc_listFormItems option:contains("'+fieldData["ctl00_cp_uc_txtItemName"]+'")', context).length){
      console.log("Field "+fieldData["ctl00_cp_uc_txtItemName"]+" exists. Skipping...");
      fieldData = data.fields.shift();
    }
    
    if(!fieldData){
      $('iframe:first').bind('load', data, $.proxy(this.importLayoutTab, this));
      this.navigate(2);
      return;
    }
    
    this.setInputs(fieldData, context);
    $('#ctl00_cp_uc_btnAdd', context).trigger('click');
    
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
          text:"Web app was imported successfully!",
          css: "alert-success"
        }
      });  
      this.worker.postMessage({ event:"WebApp:importSettings" });
      return;
    }
    
    this.setInputs(data.autoresponder, context);
    $('#ctl00_cp_uc_btnSubmit', context).trigger('click');
    
    this.worker.postMessage({
      event:"Page:status", 
      data:{
        text:"Web app "+(data.name||"")+" was imported successfully!",
        css: "alert-success"
      }
    });  
    this.worker.postMessage({ event:"WebApp:importSettings" });
  }
});

