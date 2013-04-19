try{
  if(window.authData && window.authData.hasOwnProperty('apiUrl')){ 
    var input= document.createElement('input'); 
    input.id='__siteApiBaseUrl'; 
    input.type='text'; 
    input.value = authData.apiUrl; 
    document.body.appendChild(input);
  }
}catch(e){
  console.error(e)
}