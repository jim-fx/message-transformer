var socket = io();
var inputElement = document.getElementById("text-input");
var startListenElement = document.getElementById("start-listening");

var typeWriter = new Typewriter('#typeWrapper', {
  autoStart: true,
  devMode: false,
  delay: 35,
});

function sendMessage(msg) {
  socket.emit("msg", msg);
  writeToScreen("sending: " + msg);

  setTimeout(() => {
    writeToScreen("message sent")
  }, 2000)
}

socket.on("msg", console.log);

var speech = new webkitSpeechRecognition();

speech.continuous = true;

startListenElement.style.display = "none";

var currentResultIndex = 0;
speech.onresult = function (event) {
  // console.log(event);
  // var res = event.results[currentResultIndex][0].transcript;
  // currentResultIndex++;
  //sendMessage(res);
};

writeToScreen("Listening to you...");


setTimeout(() => {
  writeToScreen("I can't breath");
}, 5000)


function writeToScreen(msg) {
  var now = new Date();
  var date = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "  |  11:40:" + now.getSeconds();

  typeWriter.typeString("<br>" + date + " ==> " + msg + "<br>");
  typeWriter.start();

  //document.body.innerHTML += "<br>" + date +" --> " + msg + "<br>";


}