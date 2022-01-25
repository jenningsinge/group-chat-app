const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const io = new Server(server);

const messages = [];
const channels = ["Welcome", "Test1", "Test2"];

app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.path);
  if (req.method === "POST") console.log(req.body);
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/messages", (req, res) => {
  res.send(messages);
});

app.get("/channels", (req, res) => {
  res.send(channels);
});

app.post("/channels", (req, res) => {
  channels.push(req.body.ch);
  res.send(req.body);
});

io.on("connection", (socket) => {
  socket.on("chat message", (msg) => {
    messages.push(msg);
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("listening on port 3000");
});
