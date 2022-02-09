if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

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
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/groupChatApp";
const mongoose = require("mongoose");
mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Connected to mongodb");
  })
  .catch((err) => {
    console.log("Connection failed");
    console.error(err);
  });

// Models
const Channel = require("./db/models/channel");
const Message = require("./db/models/message");
const User = require("./db/models/user");

// Authentication
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Sessions
const MongoStore = require("connect-mongo");
const secret = process.env.SECRET || "thisshouldbeabettersecret";
app.use(
  session({
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
    store: MongoStore.create({
      mongoUrl: dbUrl,
      touchAfter: 24 * 60 * 60,
      crypto: {
        secret,
      },
    }),
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// HTTP Post Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(req.method, req.path);
  if (req.method === "POST") console.log(req.body);
  next();
});

// Middleware
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Routes
app.get("/", isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"));
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username });
  const registeredUser = await User.register(user, password);
  req.login(registeredUser, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      res.redirect("/");
    }
  });
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.post("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

app.get("/loggedinuser", (req, res) => {
  res.send(req.user);
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
  })
    .populate({ path: "messages", populate: { path: "author" } })
    .exec();
  const messages = channel.messages;
  res.send(messages);
});

// socket.io
io.on("connection", (socket) => {
  // chat : { channel : String, message: String }
  socket.on("chat message", async (chat) => {
    const { channel: name, message: content, username } = chat;
    const user = await User.findOne({ username });
    const message = new Message({ content, author: user._id });
    const channel = await Channel.findOne({ name });
    channel.messages.push(message);
    await Promise.all([message.save(), channel.save()]);
    io.emit("chat message", chat);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
