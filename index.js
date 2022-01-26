const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const io = new Server(server);

const channels = new Set();
channels.add("Welcome");
const messages = new Map();
messages.set("Welcome", []);

app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.path);
  if (req.method === "POST") console.log(req.body);
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/channels", (req, res) => {
  res.send([...channels]);
});

app.post("/channels", (req, res) => {
  channels.add(req.body.ch);
  messages.set(req.body.ch, []);
  res.send(req.body);
});

app.get("/:channel", (req, res) => {
  res.send(messages.get(req.params.channel));
});

io.on("connection", (socket) => {
  socket.on("chat message", (chat) => {
    const { ch, msg } = chat;
    messages.get(ch).push(msg);
    io.emit("chat message", chat);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("listening on port 3000");
});
