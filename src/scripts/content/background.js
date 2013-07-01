function init(tabId, changeInfo, tab) {
  // Show BC icon only if the user is on Web app create/edit page
  chrome.pageAction.hide(tabId);
  
  if(tab.status == "complete" && tab.url.indexOf('AdminConsole') && showIcon(tab.url)){
    chrome.pageAction.show(tab.id);
  }
};

chrome.tabs.onUpdated.addListener(init);

function showIcon(url){
  // WebApp edit/create page
  if(url && /AdminConsole\/\#\!\/Admin\/CustomContentType.aspx\?CustomContentID\=\-?\d/.test(url))
    return true;
  return false
}