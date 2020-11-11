// window.addEventListener("load" function(e){
// 	alert("hahahha");
// });


// // function btntest_onclick()
// // {
// //     window.location.href = "push/index.html";
// // }

document.getElementById("myButton").addEventListener("click", myFunction);

function myFunction() {

  //window.location.href = "push/index.html";

  (function (d, s, id) {
    var js, sdkjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
      return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "MFPPushSDK.js";
    sdkjs.parentNode.insertBefore(js, sdkjs);
  }(document, 'script', 'pushsdk'));

  window.sdkAsyncInit = function () {
    var res = new MFPPush(); //create an instance of MFFPush
    res.isDebugEnable(true) // for debugging
    function callback(response) {
      console.log(response.response)
      console.log("hahahah")
    }
    var params = {
      "appGUID": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
      "appRegion": ".ng.bluemix.net",
      "clientSecret": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
    }
    res.initializeApp(params, function (response) {
      console.log(response.response)
      console.log("hahahah")
      // initialize Push Service
      console.log("l")
      res.registerApp("ananth123", function (response) { // register device in push service
        console.log("reeeeeeeeee")
        console.log(response.response)
        // res.retrieveAvailableTags(function(response) { //Retrieve available tags
        //   alert(response.response)
        //   alert("here you go")
        //   var json = JSON.parse(response.response);
        //   var tagsA = []
        //   for (i in json.tags){
        //     tagsA.push(json.tags[i].name)
        //     alert(json.tags[i].name)
        //   }
        //   alert(tagsA)
        //   res.subscribe(tagsA,function(response) { // subscribe to available tags
        //       alert(response.response)
        //       tagsA.shift();
        //       res.unSubscribe(tagsA,function(response) { // unsubscribe from tags
        //           alert(response.response)
        //           res.unRegisterDevice(function(response) { // unregister device
        //               alert(response.response)
        //             })
        //         })
        //   })
        // })
      })
    })
  };
}