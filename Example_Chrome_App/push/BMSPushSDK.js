/*
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
*/
'use strict'
/*
The variables for SDK to work. Need to be figured out how to set them globally
*/
var _appId = "";
var _pushClientSecret = "";
var _appRegion = "";
var _devId = "";
var _userId = "";
var isPushInitialized = false;
var isDebug = true; /* Enable for debuging*/
var _isUserIdEnabled = false;
var _isExtension = false;
var _gcmSenderId = "";
var reWriteDomain = "";
var BMSPushResponse = {};

function BMSPush(){
  /**
  * Initialize the Push
  *
  * @param appGUID - The push service App Id value
  * @param appRegion - The region of the push service you hosted. Eg: .ng.bluemix.net, .eu-gb.bluemix.net or .au-syd.bluemix.net
  * @param clientSecret - The push service client secret value -- optional
  */
  this.initialize = function(params, callback ) {
    printResults("started initialize");
    _appId = params.appGUID ? params.appGUID : "";
    _appRegion = params.appRegion ? params.appRegion : "";
    _pushClientSecret = params.clientSecret ? params.clientSecret : "";
    _gcmSenderId = params.gcmAppId ? params.gcmAppId : "";

    if (validateInput(_appId) && validateInput(_appRegion)) {
      setRewriteDomain(_appRegion);
      if (validateInput(_pushClientSecret)) {
        printResults("provided a valid client Secret")
      }
      if (validateInput(_gcmSenderId)) {
        _isExtension = true;
        chrome.storage.local.get('deviceId', function (result) {
          _devId = result;
        });
        if (_devId == "" || _devId == null || _devId == undefined) {
          _devId = generateUUID();
          chrome.storage.local.set({'deviceId':_devId})
        }
        initializePush(true,callback);
      } else{
        _isExtension = false;
        if (localStorage.getItem("deviceId") == "" || localStorage.getItem("deviceId") == null) {
          _devId = generateUUID();
          localStorage.setItem("deviceId",_devId);
        }else {
          _devId = localStorage.getItem("deviceId");
        }
      }
      
      checkNotificationsupport(initializePush,callback);
    } else {
      printResults("Please provide a valid  appGUID or/and appRegion");
      BMSPushResponseSet("Please provide a valid  appGUID or/and appRegion",404,"Error")
      callback (PushResponse);
    }
  };

  /**
  * Registers the device on to the BMSPush Notification Server
  *
  */
  this.register = function (callbackM){
    _userId = "";
    registerPush(_userId,callbackM)
  };

  /**
  * Registers the device on to the BMSPush Notification Server
  *
  * @param userId: the User ID value.
  */
  this.registerWithUserId = function (userId, callbackM){
    registerPush(userId,callbackM)
  };

  /**
  * Unregisters the device from the BMSPush Notification Server
  *
  */
  this.unRegisterDevice = function(callbackM){
    printResults("started Un-registration");
    navigator.serviceWorker.ready.then(function(reg) {
      reg.pushManager.getSubscription().then(
        function(subscription) {

          setTimeout(function() {
            // We have a subcription, so call unsubscribe on it
            subscription.unsubscribe().then(function(successful) {
              printResults('Successfully unRegistered from GCM push notification');
              printResults('Start Unregistering from the Bluemix Push')
              callback (unRegisterDevice(callbackM));
            }).catch(function(e) {
              // We failed to unsubscribe, this can lead to
              // an unusual state, so may be best to remove
              // the subscription id from your data store and
              // inform the user that you disabled push
              printResults('Unsubscription error: ', e);
              callback("Error in Unregistration")
              BMSPushResponseSet("Insufficient Scope. Error in Unregistration",403,"Error")
              callbackM(BMSPushResponse)
            })
          },3000);
        }).catch(function(e) {
          printResults('Error thrown while unsubscribing from push messaging :', e);
          callback("Error in Unregistration")
          var error = "Error thrown while unsubscribing from push messaging :"+e;
          BMSPushResponseSet(error,403,"Error");
          callbackM(BMSPushResponse)
        });
      });
   };

    /**
    * Subscribes to a particular backend mobile application Tag(s)
    *
    * @param tags - The Tag array to subscribe to. Eg; ["tag1","tag2"]
    */
    this.subscribe = function(tagArray,callbackM){

      printResults("started Subscribing tags");
      if (tagArray.length > 0) {
        callback(subscribeTags(tagArray,callbackM));
      } else {
        printResults("Error.  Tag array cannot be null. Create tags in your Bluemix App");
        BMSPushResponseSet("Error.  Tag array cannot be null. Create tags in your Bluemix App",403,"Error");
        callbackM(BMSPushResponse)
      }
    };

    /**
    * Unsubscribes from an backend mobile application Tag(s)
    *
    * @param  tags - The Tag name array to unsubscribe from. Eg: ["tag1","tag2"]
    */
    this.unSubscribe = function(tagArray,callbackM){
      printResults("started UnSubscribing tags");
      if (tagArray.length > 0) {
        callback(unSubscribeTags(tagArray,callbackM));
      } else {
        printResults("Error.  Tag array cannot be null.");
        BMSPushResponseSet("Error.  Tag array cannot be null.",403,"Error");
        callbackM(BMSPushResponse)
      }
    };

    /**
    * Gets the Tags that are subscribed by the device
    *
    */
    this.retrieveSubscriptions = function(callbackM){
      printResults("Started retrieve Subscription tags");
      callback(retrieveTagsSubscriptions(callbackM));
    };

    /**
    * Gets all the available Tags for the backend mobile application
    *
    */
    this.retrieveAvailableTags = function(callbackM){
      printResults("started retrieve available tags");
      callback(retrieveTagsAvailable(callbackM));
    };
    var BMSPushResponseSet = function(response, statusCode, error) {

      BMSPushResponse.response = response;
      BMSPushResponse.error = error;
      BMSPushResponse.statusCode = statusCode;
    }

    this.pushResponse = function(){
      return BMSPushResponse;
    };
    this.isDebugEnable = function(value) {
      if(typeof(value) === "boolean"){
        isDebug = value;
      }
    };

    /*
    Internal functions start here..
    */

    function registerPush(userId,callbackM) {
      if (validateInput(userId)) {
        printResults("set userId registration")
        _isUserIdEnabled = true;
        _userId = userId;
      }
      if (!_isExtension) {

        printResults("started registration");
        navigator.serviceWorker.ready.then(function(reg) {
          reg.pushManager.getSubscription().then(
            function(subscription) {
              if (subscription) {
                registerUsingToken(subscription,callbackM);
              } else {
                reg.pushManager.subscribe({
                  userVisibleOnly: true
                }).then(function(subscription) {
                  registerUsingToken(subscription,callbackM);
                }).catch(function(error) {
                  if (Notification.permission === 'denied') {
                    // The user denied the notification permission which
                    // means we failed to subscribe and the user will need
                    // to manually change the notification permission to
                    // subscribe to push messages
                    printResults('Permission for Notifications was denied');
                    BMSPushResponseSet("Notifications aren\'t supported on service workers.",401,"Error");
                  } else {
                    // A problem occurred with the subscription, this can
                    // often be down to an issue or lack of the gcm_sender_id
                    // and / or gcm_user_visible_only
                    printResults('Unable to subscribe to push.', error);
                    BMSPushResponseSet("Notifications aren\'t supported on service workers.",401,"Error");
                  }
                  callback("Error in registration")
                  callbackM(BMSPushResponse)
                });
              }
            }).catch(function(e) {
              printResults('Error thrown while subscribing from ' +
              'push messaging.', e);
              BMSPushResponseSet(e,401,"Error");
              callbackM(BMSPushResponse)
            });
          });

      }else{

         printResults("sender Id is : ",_gcmSenderId);
          var senderIds = [_gcmSenderId];
          chrome.gcm.register(senderIds, function(registrationId){

            if (chrome.runtime.lastError) {
              // When the registration fails, handle the error and retry the
              // registration later.
              BMSPushResponseSet(chrome.runtime.lastError,401,"Error");
              callbackM(MFPPushResponse)
              return;
            }
             BMSPushResponseSet(res.responseText,201,"");
            printResults("The response is : ",registrationId);
          });
      }
      
    }
    function update () {

      function callback(response) {
        printResults("updation is done :", response);
      }
      registerPush(_userId, callback);
    }
    function initializePush(value, callbackM) {
      if (value === true) {
        BMSPushResponseSet("Successfully initialized Push",200, "")
        printResults("Successfully Initialized")
        isPushInitialized = true;
        callbackM(BMSPushResponse)
      } else {
        printResults("Error in Initializing push");
        isPushInitialized = false;
        callbackM(BMSPushResponse)
      }
    }

    function sendMessage(message) {
      return new Promise(function(resolve, reject) {
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function(event) {
          if (event.data.error) {
            reject(event.data.error);
          } else {
            resolve(event.data);
            update();
          }
        };
        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
      });
    }

    function checkNotificationsupport(initializePushM,callbackM) {
      printResults("Started checking the notification compatibility");
      if ('serviceWorker' in navigator) {
        if(navigator.userAgent.indexOf("Firefox") != -1 )
        {
          sendMessage("Set Update Port")
        }
        navigator.serviceWorker.register('BMSPushServiceWorker.js').then(function(reg) {
          if(reg.installing) {
            printResults('Service worker installing');
          } else if(reg.waiting) {
            printResults('Service worker installed');
          } else if(reg.active) {
            printResults('Service worker active');
          }
          if (!(reg.showNotification)) {
            printResults('Notifications aren\'t supported on service workers.');
            callback("Error in initialize. Notifications aren\'t supported on service workers.")
            BMSPushResponseSet("Notifications aren\'t supported on service workers.",401,"Error");
            initializePushM(false,callbackM);
          }

          // Check the current Notification permission.
          // If its denied, it's a permanent block until the
          // user changes the permission
          if (Notification.permission === 'denied') {
            printResults('The user has blocked notifications.');
            //return false;
            callback("Error in initialize. The user has blocked notifications.")
            BMSPushResponseSet("The user has blocked notifications",401,"Error");
            initializePushM(false,callbackM);
          }

          // Check if push messaging is supported
          if (!('PushManager' in window)) {
            printResults('Push messaging isn\'t supported.');
            callback("Error in registration. Push messaging isn\'t supported.")
            BMSPushResponseSet("Push messaging isn\'t supported.",401,"Error")
            initializePushMcallback(false,callbackM);
          }
          initializePushM(true,callbackM);
        })
      }else {
        printResults('Service workers aren\'t supported in this browser.');
        callback("Service workers aren\'t supported in this browser.")
        BMSPushResponseSet("Service workers aren\'t supported in this browser.",401,"Error")
        initializePushM(false,callbackM);
      }
    }

    function callback (response){
      printResults("Response from Bluemix Push Notification Service");
      printResults(response);
    }

    /*Get subscription details*/

    function registerUsingToken(subscription, callbackM) {

      // Update status to subscribe current user on server, and to let
      // other users know this user has subscribed
      printResults('Subscription data is : ', JSON.stringify(subscription));
      printResults('endpoint:', subscription.endpoint);
      var subscriptionStr = JSON.stringify(subscription).replace(/"/g,"\\\"");
      printResults('subscription as string: ', subscriptionStr);
      _devId = localStorage.getItem("deviceId");
      localStorage.setItem("token",subscription);
      var platform = ""
      var token;

     if (!_isExtension) {

        var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
        var key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
        var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
        var authSecret = rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';

         var tokenValue = {
          "endpoint": subscription.endpoint,
          "userPublicKey": key,
          "userAuth": authSecret,
        }
        token = JSON.stringify(tokenValue)
        
        if(navigator.userAgent.indexOf("Firefox") != -1 ){

           platform = "WEB_FIREFOX"

        } else if(navigator.userAgent.indexOf("Chrome") != -1 ){

          platform = "WEB_CHROME"
        }
      } else{

          token = subscription;
          platform = "G"
      }
      

      if (_isUserIdEnabled == true){
        var device = {
          "deviceId": _devId,
          "token": token,
          "platform": platform,
          "userId":_userId
        };
        callback(registerDeviceWithUserId(device,callbackM));
      } else{
        var device = {
          "deviceId": _devId,
          "token": token,
          "platform": platform
        };
        callback(registerDevice(device, callbackM));
      }

    }
    /* Register Device without userId*/
    function registerDevice(device,callbackM) {

      printResults("Got device details without userid:", device);
      printResults("Checking the previous registration :", device);
      var devId = device.deviceId;
      get("/devices/"+devId,function ( res ) {

        printResults('previous Device Registration Result :', res);
        status = res.status ;
        if(status == 404){
          printResults('Starting New Device Registration  without userid:');
          post("/devices", function ( res ) {
            status = res.status ;

            printResults('New Device Registration without userid: Result :', res);
            if (status == 201) {
              printResults("Successfully registered device");
              printResults("The response is ,",res);
              BMSPushResponseSet(res,201,"");
              callbackM(BMSPushResponse)
            } else{
              printResults("Error in registering device");
              printResults("The response is ,",res);
              BMSPushResponseSet(res,status,"Error in registering device");
              callbackM(BMSPushResponse)
            }
            return res;
          },device,null);
        }else if ((status == 406) || (status == 500)) {
          printResults("Error while verifying previuos device registration without userid:");
          printResults("The response is ,",res);
          BMSPushResponseSet(res,status,"Error while verifying previuos device registration");
          callbackM(BMSPushResponse)
          return res;
        } else  {

          var resp = JSON.parse(res.responseText);
          var rToken = resp.token;
          var rDevId = resp.deviceId;
          if ( !(rToken === device.token) ||  !(rDevId === device.deviceId)){
            put("/devices/"+devId, function ( res ) {

              status = res.status;
              if (status == 201) {
                printResults("Successfully registered device without userid:");
                printResults("The response is ,",res);
                BMSPushResponseSet(res,201,"");
                callbackM(BMSPushResponse)
              } else{
                printResults("Error in registering device without userid:");
                printResults("The response is ,",res);
                BMSPushResponseSet(res,status,"Error in registering device");
                callbackM(BMSPushResponse)
              }
              return res;
            },device,null);
          } else{
            printResults("Device is already registered and device registration parameters not changed. without userid:");
            BMSPushResponseSet(res,201,"");
            callbackM(BMSPushResponse)
            return res;
          }
        }
      }, device,null);
    }

    /* Register Device with userId*/

    function registerDeviceWithUserId(device,callbackM) {

      printResults("Got device details with userid:", device);
      printResults("Checking the previous registration :", device);
      var devId = device.deviceId;
      _userId = device.userId;
      if (validateInput(_pushClientSecret) && validateInput(_userId)) {
        get("/devices/"+devId,function ( res ) {
          printResults('previous Device Registration Result :', res);
          status = res.status ;
          if(status == 404){
            printResults('Starting New Device Registration ');
            post("/devices", function ( res ) {

              status = res.status ;

              printResults('New Device Registration Result :', res);
              if (status == 201) {
                printResults("Successfully registered device");
                printResults("The response is ,",res);
                BMSPushResponseSet(res.responseText,201,"");
                callbackM(BMSPushResponse)
              } else{
                printResults("Erron in registering device");
                printResults("The response is ,",res);
                BMSPushResponseSet(res.responseText,status,"Error in registering device");
                callbackM(BMSPushResponse)
              }
              return res;
            },device,{
              "clientSecret": _pushClientSecret
            });
          }else if ((status == 406) || (status == 500)) {
            printResults("The response is ,",res);
            BMSPushResponseSet(res.responseText,status,"Error while verifying previuos device registration");
            callbackM(BMSPushResponse)
            return res;
          } else  {

            var resp = JSON.parse(res.responseText);
            var rToken = resp.token;
            var rDevId = resp.deviceId;
            var userId = resp.userId;
            if ( !(rToken === device.token) ||  !(rDevId === device.deviceId) || !(userId == _userId)){
              put("/devices/"+devId, function ( res ) {
                status = res.status;
                if (status == 201) {
                  printResults("The response is ,",res);
                  BMSPushResponseSet(res.responseText,201,"");
                  callbackM(BMSPushResponse)
                } else{
                  printResults("The response is ,",res);
                  BMSPushResponseSet(res.responseText,status,"Error in registering device");
                  callbackM(BMSPushResponse)
                }
                return res;
              },device,{
                "clientSecret": _pushClientSecret
              });
            } else{
              printResults("Device is already registered and device registration parameters not changed.");
              BMSPushResponseSet(res.responseText,201,"");
              callbackM(BMSPushResponse)
              return res;
            }
          }
        }, device,{
          "clientSecret": _pushClientSecret
        });
      } else {
        printResults("Please provide valid userId and clientSecret.")
        BMSPushResponseSet("Please provide valid userId and clientSecret.",401,"Error")
        callbackM(BMSPushResponse)
      }
    }

    function unRegisterDevice (callbackM){
      printResults("Entering the unregister device");
      var devId = localStorage.getItem("deviceId");
      deletes("/devices/"+devId, function ( response ) {

        status = response.status;
        if (status == 204) {
          printResults("Successfully unregistered the device");
          BMSPushResponseSet(response.responseText,204,"");
          localStorage.setItem("deviceId","");
          callbackM(BMSPushResponse)
          return response;
        } else{
          printResults("Error in  unregistering the device");
          BMSPushResponseSet(response.responseText,status,"Error")
          callbackM(BMSPushResponse)
          return response;
        }
      },null);
    }

    function subscribeTags(tagArray,callbackM) {
      printResults("Entering the subscribe tags");
      var devId = localStorage.getItem("deviceId");
      var tags = {
        "deviceId": devId,
        "tagNames": tagArray
      };
      post("/subscriptions", function ( res ) {
        status = res.status ;
        printResults('Tag Subscription Result :', res);
        if (status >= 200 && status <= 300)  {
          printResults("Successfully subscribed to tags -");
          printResults("The response is ,",res);
          BMSPushResponseSet(res.responseText,status,"");
          callbackM(BMSPushResponse)
        } else{
          printResults("Error while subscribing to tags :");
          printResults("The response is ,",res);
          BMSPushResponseSet(res.responseText,status,"Error while subscribing to tags :");
          callbackM(BMSPushResponse)
        }
        return res;
      },tags,null);
    }

    function unSubscribeTags(tagArray,callbackM) {
      printResults("Entering the Un-subscribe tags");
      var devId = localStorage.getItem("deviceId");
      var tags = {
        "deviceId": devId,
        "tagNames": tagArray
      };
      post("/subscriptions?action=delete", function ( res ) {
        status = res.status ;
        printResults('Tag un-subscription Result :', res);
        if (status >= 200 && status <= 300)  {
          printResults("Successfully Un-subscribed to tags -");
          printResults("The response is ,",res);
          BMSPushResponseSet(res.responseText,status,"");
          callbackM(BMSPushResponse)
        } else{
          printResults("Error while Un-subscribing to tags :");
          printResults("The response is ,",res);
          BMSPushResponseSet(res.responseText,status,"Error while Un-subscribing to tags :");
          callbackM(BMSPushResponse)
        }
        return res;
      },tags,null);
    }

    function retrieveTagsSubscriptions(callbackM) {
      printResults("Entering the Retrieve subscriptions of tags");
      var devId = localStorage.getItem("deviceId");

      get("/subscriptions?deviceId="+devId,function ( res ) {
        status = res.status ;
        printResults('Retrieve subscription Result :', res);
        if (status >= 200 && status <= 300)  {
          printResults("Successfully retrieved subscribed tags");
          printResults("The response is ,",res);
          BMSPushResponseSet(res.responseText,status,"");
          callbackM(BMSPushResponse)
        } else{
          printResults("Error while retrieve subscribed tags :");
          printResults("The response is ,",res);
          BMSPushResponseSet(res.responseText,status,"Error while retrieve subscribed tags :");
          callbackM(BMSPushResponse)
        }
        return res;
      },null);
    }

    function retrieveTagsAvailable(callbackM) {
      printResults("Entering the Retrieve available tags");
      printResults("Entering the Retrieve subscriptions of tags");
      get("/tags",function ( res ) {
        status = res.status ;
        printResults('Retrieve available tags Result :', res);
        if (status >= 200 && status <= 300)  {
          printResults("Successfully retrieved available tags");
          printResults("The response is ,",res);
          BMSPushResponseSet(res.responseText,status,"");
          callbackM(BMSPushResponse)
        } else{
          printResults("Error while retrieve available tags :");
          printResults("The response is ,",res);
          BMSPushResponseSet(res.responseText,status,"Error while retrieve available tags :");
          callbackM(BMSPushResponse)
        }
        return res;
      },null);
    }
    /*
    API calls start here
    */

    function get (action, callback, data, headers) {
      return callPushRest('GET', callback, action, data, headers);
    }

    function post (action, callback, data, headers) {
      return callPushRest('POST', callback, action, data, headers);
    }

    function put (action, callback, data, headers) {
      return callPushRest('PUT', callback, action, data, headers);
    }

    function deletes (action,callback, data, headers) {
      return callPushRest('DELETE', callback, action, data, headers);
    }


    function callPushRest(method, callback, action, data, headers)
    {
      // _appRegion = localStorage.getItem("appRegion");
      // _appId = localStorage.getItem("appId");

      //var url = 'https://iBMSush'+_appRegion+'/iBMSush/v1/apps/'+_appId;
      var url = 'https://imfpush'+_appRegion+'/imfpush/v1/apps/'+_appId;
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 )
        callback(xmlHttp);
      }
      xmlHttp.open(method, url+action, true); // true for asynchronous
      xmlHttp.setRequestHeader('Content-Type', 'application/json; charset = UTF-8');
      //  xmlHttp.setRequestHeader('X-Rewrite-Domain',"stage1-dev.ng.bluemix.net");
       if (headers) {
        for (let key of Object.keys(headers)) {
          xmlHttp.setRequestHeader(key, headers[key]);
        }
      }
      xmlHttp.send(JSON.stringify(data));
    }

    function setRewriteDomain(appReg) {
      var a = appReg.split(".");
      if(appReg.includes("stage1-dev")){
        _appRegion = ".stage1-dev."+a[2]+".bluemix.net"
        reWriteDomain = "stage1-dev."+a[2]+".bluemix.net"
      } else if (appReg.includes("stage1-test")) {
        _appRegion = ".stage1-test."+a[2]+".bluemix.net"
        reWriteDomain = "stage1-test."+a[2]+".bluemix.net"
      }else if (appReg.includes("stage1")) {
        _appRegion = ".stage1."+a[2]+".bluemix.net"
        reWriteDomain = "stage1."+a[2]+".bluemix.net"
      }else if (appReg.includes("ng")) {
        _appRegion = ".ng.bluemix.net"
        reWriteDomain = "ng.bluemix.net"
      }else if (appReg.includes("eu-gb")) {
        _appRegion = ".eu-gb.bluemix.net"
        reWriteDomain = "eu-gb.bluemix.net"
      }else if (appReg.includes("au-syd")) {
        _appRegion = ".au-syd.bluemix.net"
        reWriteDomain = "au-syd.bluemix.net"
      }
    }
  function generateUUID (){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  function validateInput(stringValue) {

    return (stringValue === undefined) || (stringValue == null) || (stringValue.length <= 0) || (stringValue == '') ? false:true;
  }

  function printResults (Result,a){
    if (isDebug == true) {
      if (a === undefined){
        a = " "
      }
      console.log("Response : ",Result," ",a);
    }
  }

  // Chrome App and Extension Event Handlers 

  // TODO: Add to different class

  chrome.gcm.onMessage.addListener(onMessageReceived);
  chrome.notifications.onClicked.addListener(notification_onClicked);
  chrome.notifications.onButtonClicked.addListener(notifiation_buttonClicked);


   function onMessageReceived(message) {

    var msgString = "";
    var msgtitle = message.data.title;
    if (msgtitle == null) {
      msgtitle = chrome.runtime.getManifest().name;
    }
    
    var mshIconUrl = message.data.icon;

    if (message.data.icon == null) {
      var icons = chrome.runtime.getManifest().icons;
      mshIconUrl = icons["128"];
      if (mshIconUrl == null) {
      mshIconUrl = icons["48"];
      if (mshIconUrl == null){
        mshIconUrl = icons["16"];
      }
      }
    }
    
    //var additionalPayload = JSON.parse(message.data.payload);
      
    var notification = {
        title: msgtitle,
        iconUrl: mshIconUrl,
        type: 'basic',
        message: message.data.alert
      };
    chrome.notifications.create(getNotificationId(), notification, function(){});
  }
  
  function getNotificationId() {
    var id = Math.floor(Math.random() * 9007199254740992) + 1;
    return id.toString();
  }

  function notificationOpened(notifiationId) {

    chrome.notifications.clear(notifiationId, function(){});
   

      var openUrl = chrome.runtime.getManifest().urlString ? chrome.runtime.getManifest().urlString : "https://new-console.ng.bluemix.net/docs/services/mobilepush/index.html";
      var urlObject = {url: openUrl};
      if (chrome.browser){
        chrome.browser.openTab(urlObject);
      }
      else{
        chrome.tabs.create(urlObject);
      }
    return true;
  }
  
  function notification_onClicked(notifiationId) {

    printResults("Closing Notification ", " ");
    notificationOpened(notifiationId);
  }
  
  function notifiation_buttonClicked(notifiationId, buttonIndex) {

    printResults("Clicked notifications button ", " ");
    notificationOpened(notifiationId);
    
  }

}
