try{
  if (typeof ($telerik) != 'undefined') {
    if ($telerik.radControls && Telerik.Web.UI.RadEditor) {
      for (var i = 0, l = $telerik.radControls.length; i < l; i++) {
        var control = $telerik.radControls[i];
        if (Telerik.Web.UI.RadEditor.isInstanceOfType(control)) {
          var editor = control;
          var radInput = document.createElement('input');
          radInput.type="hidden";
          radInput.setAttribute('data-rad-id', editor.get_id())
          radInput.className = 'injected-rad-editor-input';
          radInput.value = editor.get_html();
          document.body.appendChild(radInput);
        }
      }
    }
  }
}catch(e){
  console.log(e)
}