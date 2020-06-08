const express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

app.use("/", express.static(__dirname + "/static"));

io.on("connection", (socket) => {
  socket.emit("debug", "You are connected");

  socket.on("msg", function (msg) {
    socket.broadcast.emit("msg", msg);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const { PORT = 8080 } = process.env;

http.listen(PORT, () => {
  console.log("listening on *:" + PORT);
});
