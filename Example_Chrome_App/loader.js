document.getElementById("myButton").addEventListener("click", register);

function register() {
  console.log("satrted")
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
