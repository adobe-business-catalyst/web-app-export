Adobe Business Catalyst web app export/import Google Chrome extension.
==
Now you can export/import/share Adobe's Business Catalyst web apps easily.

## How does it works?

First, install the extension. You can find it on [Google Web Store](https://chrome.google.com/webstore/category/home). If you want to install the latest build [follow this instructions](https://github.com/adobe-business-catalyst/web-app-export/blob/master/INSTALL.md)

### Exporting web apps.
If you want to export an existing web app, go to that app edit page. You will notice a little black *BC* icon will appear in the browser's address bar. Click on it. An popup will appear. Select the *Export* tab and press *Export* button and be patient. The extension will open every web app tab (Details/Fields/Layouts/Autoresponder) and extract the data from it. In the end, an textarea will appear filled with the web app settings in JSON format.

You can copy this JSON and share it or use it to copy the web app configs on another site.

### Importing web apps.
If you want to import an web app, go to Admin Console > *Add Web App*. Click the *BC* icon. Only the import tab is available. Paste the JSON with the web app configuration you want to import into the textarea and click *Import* button. Be patient and don't close the popup (see the note bellow) until the import is done.

#### Note:
Don't click outside of the popup area or change the tab! This will close the popup and abort the export/import operation.

## Credits

To create this extension we used:
* [jQuery](http://jquery.com/) for DOM manipulation 
* [Klass](https://github.com/ded/klass) for basic OOP 
* [jQuery Cookie plugin](https://github.com/carhartl/jquery-cookie) for cookie manipulation
* [AngularJS](http://angularjs.org/)
* [Twitter Bootstrap](http://twitter.github.io/bootstrap/) for UI
* [Font Awesome](http://fortawesome.github.com/Font-Awesome/) for cool icons