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
    console.log(data)
    if(data == "WebApp"){
      $location.path('/web-app/import-export');
    }
    $rootScope.$apply()
  })
  
  $rootScope.sendMessage({action:'Page:getContentType'});
  
}])

BC.controller('Home',['$rootScope','$location', function($rootScope, $location){
  
}]);
BC.controller('WebAppExportImport',['$scope', function($scope){
  
  $scope.reset = function(e){
    if($scope.loading){
      e.preventDefault();
      return;
    }
    $scope.message = $scope.webAppSettings = $scope.importSettings = null;
  } 
  
  $scope.export = function(){
    $scope.loading = true;
    $scope.message = $scope.webAppSettings = null;
    $scope.sendMessage({action:"WebApp:exportSettings"});
  }
  
  $scope.import = function(){
    $scope.loading = true;
    $scope.message = null;
    try{
      JSON.parse($scope.importSettings);
      $scope.sendMessage({action:"WebApp:importSettings", argv:[$scope.importSettings]});
    }catch(e){
      $scope.loading = false;
      $scope.message = {
        text:"Invalid JSON data!",
        css:"alert-error"
      };
    }
  }
  
  $scope.$on("WebApp:importSettings", function(e, data){
    $scope.loading = false;
    $scope.importSettings = null;
    chrome.storage.local.remove(['webappdata']);
    $scope.$apply();
  });
  
  $scope.$on("WebApp:exportSettings", function(e, data){
    $scope.loading = false;
    try{
      $scope.webAppSettings = JSON.stringify(data);
    }catch(e){
      $scope.message = {
        text:"Web app export generated an invalid JSON data. Maybe this is a bug. Please submit it to the developer.",
        css:"alert-error"
      }
    }
    $scope.$apply();
  });
  
  $scope.$on("WebApp:getInfo", function(e, data){
    $scope.webApp = data;
    $scope.$apply();
  });
  
  $scope.$on("Page:status", function(e, data){
    $scope.message = data
    $scope.$apply();
  });
  
  $scope.sendMessage({action:"WebApp:getInfo"});
  
  // Get web app settings stored into local storage.
  chrome.storage.local.get(["webappdata"], function(data){
    try{
      $scope.importSettings = JSON.stringify(data.webappdata);
      $scope.$apply();
    }
    catch(e){
      $scope.message = {
        text:"Invalid app data found.",
        css:"alert-error"
      }
      chrome.storage.local.remove(['webappdata']);
    }
  });
  
}]);
