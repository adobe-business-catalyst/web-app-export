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
