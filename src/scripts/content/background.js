function init(tabId, changeInfo, tab) {
  // Show BC icon only if the user is on Web app create/edit page
  chrome.pageAction.hide(tabId);
  
  if(tab.status == "complete" && tab.url.indexOf('AdminConsole')){
    var worker = chrome.tabs.connect(tab.id, {name: "BC"});
    
    worker.onMessage.addListener(function(msg){
        console.log(msg, tab)
        if(msg && msg.data){
          chrome.pageAction.show(tab.id);
        }
    });
    worker.postMessage({action:'Page:getContentType'});
  }
};

chrome.tabs.onUpdated.addListener(init);