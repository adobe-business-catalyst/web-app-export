function init(tabId, changeInfo, tab) {
  // Show BC icon only if the user is on Web app create/edit page
  chrome.pageAction.hide(tabId);
  
  if (tab.url.indexOf('CustomContentType.aspx') > -1) {
  //if (tab.url.indexOf('AdminConsole') > -1) {
    chrome.pageAction.show(tab.id);
  }
};

chrome.tabs.onUpdated.addListener(init);

