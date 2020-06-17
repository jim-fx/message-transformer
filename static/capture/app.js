function startScreenCapture() {
  if (navigator.getDisplayMedia) {
    return navigator.getDisplayMedia({ video: true });
  } else if (navigator.mediaDevices.getDisplayMedia) {
    return navigator.mediaDevices.getDisplayMedia({ video: true });
  } else {
    return navigator.mediaDevices.getUserMedia({
      video: { mediaSource: "screen" },
    });
  }
}

// Put variables in global scope to make them available to the browser console.
const video = document.querySelector("video");
const vidCanvas = document.createElement("canvas");
const canvas = document.querySelector("canvas");
const vidCtx = vidCanvas.getContext("2d");
const ctx = canvas.getContext("2d");

const sampler = {
  element: document.getElementById("sampler"),
  x: "x" in localStorage ? parseInt(localStorage.x) : 50,
  y: "y" in localStorage ? parseInt(localStorage.y) : 50,
  size: "size" in localStorage ? parseInt(localStorage.size) : 50,
};

const con = document.getElementById("console");
const log = function (msg) {
  con.innerHTML = msg;
};

let ws;

const { innerWidth: w, innerHeight: h } = window;

//Helper function
function EventEmitter() {
  var cbs = {};

  return {
    on: function (event, cb) {
      cbs[event] = event in cbs ? [...cbs[event], cb] : [cb];
    },
    emit: function (event, data) {
      if (event in cbs) {
        for (var i = 0; i < cbs[event].length; i++) {
          cbs[event][i](data);
        }
      }
    },
  };
}

const messages = [];
let currentMessage;
let currentOutput;

// Create all the websocket connections
function createWSConnection(url, _listener) {
  var ws = new WebSocket(url);

  var listener = _listener || EventEmitter();

  ws.onopen = function () {
    listener.emit("open");
  };
  ws.onmessage = function (msg) {
    try {
      listener.emit("msg", JSON.parse(msg.data));
    } catch (error) {}
  };

  listener.send = function (msg) {
    ws.send(msg);
  };

  ws.onclose = function () {
    ws.onopen = undefined;
    ws.onmessage = undefined;
    setTimeout(function () {
      listener.send = undefined;
      console.log("socket " + url + " has disconnected, reconnecting...");
      createWSConnection(url, listener);
    }, 1000);
  };

  return listener;
}

async function setup() {
  ws = createWSConnection("wss://kc-socket-proxy.herokuapp.com/");
  ws.on("open", function () {
    console.log("socket connected");
  });

  ws.on("msg", function (msg) {
    console.log(msg);

    const { teamname = false, lazerMessage = false } = msg;

    if (teamname === "blue") {
      if (lazerMessage) {
        messages.push(lazerMessage);
      }
    }
  });

  const constraints = {
    audio: false,
    video: true,
  };

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("click", ({ clientX: x, clientY: y }) => {
    sampler.x = x;
    sampler.y = y;

    localStorage.x = x;
    localStorage.y = y;

    sampler.element.style.top = y + "px";
    sampler.element.style.left = x + "px";
  });

  window.addEventListener("keydown", ({ key }) => {
    if (key == "ArrowUp") {
      sampler.size += 5;
    }

    if (key == "ArrowDown") {
      sampler.size -= 5;
    }

    localStorage.size = sampler.size;

    sampler.element.style.width = sampler.size + "px";
    sampler.element.style.height = sampler.size + "px";
  });

  const stream = await startScreenCapture();
  video.srcObject = stream;

  draw();
}

function getAverage(imageData) {
  const data = imageData.data;

  let colorSum = 0;

  for (let x = 0, len = data.length; x < len; x += 4) {
    colorSum += data[x];
  }

  return Math.floor(colorSum / 100 / 4);
}

let avg = 0;
let lastAvg = 0;
let averages = [];
let i = 0;
let isDetecting = false;
let isHigh = false;
const threshold = 900;

let bytes = [];

async function sendMessage(msg) {
  let j = 0;
  const int = setInterval(async function () {
    j++;
    const s = "sending";
    log(s.padEnd(s.length + (j % 4), "."));

    if (j > 10) {
      const rawResponse = await fetch(
        "https://kc-socket-proxy.herokuapp.com/api/blue",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lazerOutput: msg, display: true, keep: true }),
        }
      );
      const content = await rawResponse.json();

      log("send!");

      clearInterval(int);
    }
  }, 500);
}

function startDetecting() {
  if (isDetecting) return;

  console.log("START RECEIVING");
  if (messages.length) {
    currentMessage = messages.shift();
    currentOutput = "";
  }

  bytes = [];

  ctx.clearRect(0, 0, w, h);
  i = 0;
  isDetecting = true;

  let currentByte = [1];

  setTimeout(() => {
    const int = setInterval(() => {
      ctx.fillStyle = "white";
      ctx.fillRect(i - 1, 0, 2, h);

      if (currentByte.length === 8) {
        bytes.push(currentByte);
        currentByte = [];

        if (currentMessage && currentMessage.length) {
          currentOutput += currentMessage.slice(0, 1);
          currentMessage = currentMessage.slice(1, currentMessage.length);
          log(currentOutput);
        }
      }

      const a = averages.reduce((a, b) => a + b, 0) / averages.length;
      averages = [];
      isHigh = a > threshold;

      currentByte.push(isHigh ? 1 : 0);

      // console.log(currentByte);

      if (currentByte.length === 8) {
        let total = currentByte.reduce((a, b) => a + b, 0);

        if (total === 0 || !currentMessage || !currentMessage.length) {
          console.log("STOP RECEIVING");
          isDetecting = false;
          sendMessage(currentOutput);
          clearInterval(int);
        }
      }
    }, 500);
  }, 500);
}

function draw() {
  requestAnimationFrame(draw);

  vidCtx.drawImage(video, 0, 0, vidCanvas.width, vidCanvas.height);
  //ctx.drawImage(vidCanvas, 0, 0, 200, 100);

  avg = getAverage(
    vidCtx.getImageData(
      ((sampler.x - sampler.size / 2) / w) * vidCanvas.width,
      ((sampler.y - sampler.size / 2) / h) * vidCanvas.height,
      sampler.size,
      sampler.size
    )
  );
  averages.push(avg);
  if (averages.length > 200) averages.shift();
  console.log(avg);
  if (avg > threshold) startDetecting();

  i = (i + 1) % w;

  ctx.clearRect(i, 0, 1, h);

  ctx.fillStyle = avg > threshold ? "rgba(255, 255, 255, 0.2)" : "black";
  ctx.fillRect(i, 0, 1, h);

  ctx.fillStyle = "yellow";
  ctx.fillRect(i, h / 2 - threshold, 2, 2);

  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.moveTo(i - 1, h / 2 - lastAvg, 2, 2);
  ctx.lineTo(i, h / 2 - avg, 2, 2);
  ctx.stroke();
  ctx.closePath();
  lastAvg = avg;
}

setup();
