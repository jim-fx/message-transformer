const express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
const lostInTranslation = require("./src/translate");

app.use("/", express.static(__dirname + "/static"));

io.on("connection", (socket) => {
  socket.emit("debug", "You are connected");

  socket.on("msg", function (msg) {
    lostInTranslation(io, msg, 5, function (result) {
      console.log("Final: ", result);

      socket.emit("result", result);
    });
  });
});

const { PORT = 8080 } = process.env;

http.listen(PORT, () => {
  console.log("listening on *:" + PORT);
});