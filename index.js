// Express
const express = require("express");
const app = express();

// General
const http = require("http");
const server = http.createServer(app);
const path = require("path");

// socket.io
const { Server } = require("socket.io");
const io = new Server(server);

// MongoDB/Mongoose
const mongoose = require("mongoose");
mongoose
  .connect("mongodb://localhost:27017/groupChatApp")
  .then(() => {
    console.log("Connected to mongodb");
  })
  .catch((err) => {
    console.log("Connection failed");
    console.error(err);
  });

// Models
const Channel = require("./db/models/channel");
const User = require("./db/models/user");

// Authentication
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Sessions
app.use(
  session({
    secret: "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
  })
);

// Passport
// app.use(passport.initialize());
// app.use(passport.initialize());

// HTTP Post Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(req.method, req.path);
  if (req.method === "POST") console.log(req.body);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  res.send(req.body);
});

app.get("/channels", async (req, res) => {
  const channels = await Channel.find({}).exec();
  const channelNames = channels.map((ch) => ch.name);
  res.send(channelNames);
});

app.post("/channels", async (req, res) => {
  const channel = new Channel({ name: req.body.channel, messages: [] });
  await channel.save();
  res.status(201).send();
});

app.get("/channels/:channelName", async (req, res) => {
  const channel = await Channel.findOne({
    name: req.params.channelName,
  }).exec();
  const messages = channel.messages;
  res.send(messages);
});

// socket.io
io.on("connection", (socket) => {
  // chat : { channel : String, message: String }
  socket.on("chat message", async (chat) => {
    const { channel: channelName, message } = chat;
    const channel = await Channel.findOne({ name: channelName });
    channel.messages.push(message);
    await channel.save();
    io.emit("chat message", chat);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("listening on port 3000");
});
