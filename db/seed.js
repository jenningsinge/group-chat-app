if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const { url } = require("./config");
const Channel = require("./models/channel");
const Message = require("./models/message");
const User = require("./models/user");

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/groupChatApp";
mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Connected to mongodb");
  })
  .catch((err) => {
    console.log("Connection failed");
    console.error(err);
  });

const seedDB = async () => {
  await Channel.deleteMany({});
  await Message.deleteMany({});
  await User.deleteMany({});

  await Channel.insertMany([
    {
      name: "Welcome",
    },
    {
      name: "Software Engineering",
    },
    {
      name: "Hollow Knight",
    },
  ]);

  // Welcome
  // const welcomeUsers = ["Guy", "Giorno", "Oingo", "Boingo"];
  // const registeredUsers = [];
  // welcomeUsers.forEach(async (username) => {
  //   const user = new User({ username });
  //   const registeredUser = await User.register(user, username);
  //   registeredUsers.push(registeredUser);
  // });
  // const channel = await Channel.findOne({ name: "Welcome" });
  // const message1 = new Message({
  //   content: "Hi",
  //   author: registeredUsers[0]._id,
  // });
  // const message2 = new Message({
  //   content: "Shut up",
  //   author: registeredUsers[1]._id,
  // });
  // const message3 = new Message({
  //   content: "That's not very nice",
  //   author: registeredUsers[2]._id,
  // });
  // const message4 = new Message({
  //   content: "Yeah",
  //   author: registeredUsers[3]._id,
  // });
  // channel.messages.push(message1, message2, message3, message4);
  // await channel.save();
  // await Promise.all([
  //   message1.save(),
  //   message2.save(),
  //   message3.save(),
  //   message4.save(),
  // ]);
};

seedDB().then(() => {
  mongoose.connection.close();
});
