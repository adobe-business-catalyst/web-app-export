// Helper functions
function unserialize(p){
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

$(document).ready(function(){
  chrome.runtime.onConnect.addListener(onConnect);
});

var onConnect = function(worker){
   
    if(worker.name == "BC"){
      worker.onMessage.addListener(function(msg){
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
        
      })
    }
}

