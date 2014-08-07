Adobe Business Catalyst web app export/import extension for Google Chrome.
==

##UPDATE
Adobe has released the open platform (read more about it here : http://goo.gl/UqvR0R) lately. Now the web app items can be exported easily using the web apps REST API.
Also, the Admin UI was changed. The extension was relying on the Admin UI html structure. This is the cause why is not working anymore. To backup your BC data you can use BackupBC http://www.backupbc.com/

Maybe, if I have the time, I will build another one, that uses the REST APIs.

Now you can export/import/share Adobe's Business Catalyst web apps easily from within Google Chrome.

## How does it work?

First, install the extension. You can find it on the [Google Web Store](https://chrome.google.com/webstore/detail/bc-web-app-config-importe/cclmieohbdngonpnlcacncndajnfcjoi?hl=en-US&gl=001). If you want to install the latest build [follow these instructions](https://github.com/adobe-business-catalyst/web-app-export/blob/master/INSTALL.md)

### Exporting web apps.
If you want to export an existing web app, go to that app's Edit page. You will notice a little black [BC] icon will appear in the browser's address bar. Click on that icon and a popup dialogue will appear. Select the *Export* tab then press *Export* button and be patient. The Chrome extension will automatically open every web app tab (Details/Fields/Layouts/Autoresponder) and extract the data from it. In the end, a textarea will appear filled with the web app settings in JSON format.

You can copy this JSON and share it or use it to copy the web app configs to another site.

### Importing web apps.
If you want to import a web app, go to the Business Catalyst Admin Console and choose  *Add Web App*. Click the black [BC] icon in the address bar. Only the import tab will be available. Paste the JSON with the web app configuration you want to import into the textarea and click the *Import* button. Be patient and don't close the popup (see the note bellow) until the import is done.

#### Important Note:
Don't click outside of the popup area or change the tab! This will close the popup and abort the export/import operation.

## Credits

To create this extension we used:
* [jQuery](http://jquery.com/) for DOM manipulation 
* [Klass](https://github.com/ded/klass) for basic OOP 
* [jQuery Cookie plugin](https://github.com/carhartl/jquery-cookie) for cookie manipulation
* [AngularJS](http://angularjs.org/) for the magic
* [Twitter Bootstrap](http://twitter.github.io/bootstrap/) for UI
* [Font Awesome](http://fortawesome.github.com/Font-Awesome/) for cool icons
