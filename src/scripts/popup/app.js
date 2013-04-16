var BC = angular.module('BC',[])

BC.config(['$routeProvider', function($routeProvider){
  $routeProvider.
    when('/', {controller:'Home', templateUrl:'tpl/home.html'}).
    when('/web-app/import-export', {controller:'WebAppExportImport', templateUrl:'tpl/webapp/import-export.html'}).
    
    otherwise({redirectTo:'/'});
}])

BC.run(['$rootScope','$location', function($rootScope, $location){
  $rootScope.msgBuffer = []
  $rootScope.message = null;
  
  // At first the sendMessage colects the messages to a queue
  // After the socket connection is made, the method is overwriten
  
  $rootScope.sendMessage = function(msg){
    // push the message to buffer
    $rootScope.msgBuffer.push(msg)
  }
  
  chrome.tabs.getSelected(null, function(tab) {
    // Create the workers
    var worker = chrome.tabs.connect(tab.id, {name: "BC"});
    
    worker.onMessage.addListener(function(msg){
        if(msg && msg.event){
          $rootScope.$broadcast(msg.event, msg.data);
        }
    });
    
    // Overwrite the send message method
    $rootScope.sendMessage = function(msg){
      worker.postMessage(msg);
    }
    
    // transmit the messages from queue, if any
    while( msg = $rootScope.msgBuffer.shift() ){
      $rootScope.sendMessage(msg);
    }
    
  });
    
  $rootScope.$on("Page:getContentType", function(e, data){
    if(data == "WebApp"){
      $location.path('/web-app/import-export');
    }
    $rootScope.$apply()
  })
  
  $rootScope.sendMessage({action:'Page:getContentType'});
  
}])
