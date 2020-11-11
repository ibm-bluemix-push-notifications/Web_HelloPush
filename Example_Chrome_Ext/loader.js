document.getElementById("myButton").addEventListener("click", register);

function register() {
  var bmsPush = new BMSPush(); //create an instance of BMSPush
  function callback(response) {
    console.log(response.response)
  }

  var initParams = {
    "appGUID":"push app GUID",
    "appRegion":"Region where service hosted",
    "clientSecret":"clientSecret of your push service"
  }
  bmsPush.initialize(initParams, callback)
  bmsPush.register(function(response) {
    console.log(response.response)
  })
}


chrome.gcm.onMessage.addListener(BMSPushBackground.onMessageReceived);
chrome.notifications.onClicked.addListener(BMSPushBackground.notification_onClicked);
chrome.notifications.onButtonClicked.addListener(BMSPushBackground.notifiation_buttonClicked);
