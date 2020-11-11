# Web_HelloPush

Examples of Websites and Chrome Apps/Extensions using Bluemix Web Push notifications service.

## Website (Chrome, Firefox and Safari)

### Prerequisites

<ul>
<li>Firefox 49+</li>
<li>Chrome 54+</li>
<li>Safari 9.1+</li>
</ul>

### Configurations  

1. Open **Example_Website**.
2. [Download](https://github.com/ibm-bluemix-mobile-services/bms-clientsdk-javascript-webpush) and add latest **BMSPushSDK.js** and **BMSPushServiceWorker.js**
3. Go to **public/index.html** and add your push service credentials (**line 67**).
4. Got to [Bluemix Catalog](https://console.ng.bluemix.net/catalog/)
5. Create a nodeJs Starter application and download the starter code.
6. replace contents of `public` folder with the `Example_Website/public` contents.
7. push it back to Bluemix.
8. Register your website name in the push service configurations.
9. Open the websites in your browser, register for push notifications .
10. Go to your push service and send Notifications.

## Chrome App/Ext

1. Open **Example_Chrome_App/Example_Chrome_Ext**
2. Open `loader.js` and add your Push credentials.
3. Go to Chrome and `Options->More Tools->Extensions`
  <p align="center"><img src="https://github.com/ibm-bluemix-push-notifications/Web_HelloPush/blob/master/Images/Extensions.png" width="350" /></p>
4. Enable the `Developer mode` and click on the `Load unpacked extension` to load the `Example_Chrome_App/Example_Chrome_Ext` folder.

  <p align="center"><img src="https://github.com/ibm-bluemix-push-notifications/Web_HelloPush/blob/master/Images/LoadExtensions.png" width="350" /></p>



### Samples & videos

* Please visit for samples - [Github Sample](https://github.com/ibm-bluemix-mobile-services/bms-samples-android-hellopush)

* Video Tutorials Available here - [Bluemix Push Notifications](https://www.youtube.com/channel/UCRr2Wou-z91fD6QOYtZiHGA)

=======================
Copyright 2016 IBM Corp.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
