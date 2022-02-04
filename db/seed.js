const mongoose = require("mongoose");
const { url } = require("./config");
const Channel = require("./models/channel");
const User = require("./models/user");

mongoose
  .connect(url)
  .then(() => {
    console.log("Connected to mongodb");
  })
  .catch((err) => {
    console.log("Connection failed");
    console.error(err);
  });

const seedDB = async () => {
  await Channel.deleteMany({});
  await User.deleteMany({});
  await Channel.insertMany([
    {
      name: "Welcome",
      messages: ["Hello", "Hi", "How are you?"],
    },
    {
      name: "Software Engineering",
      messages: ["I am coding man", "No I am", "You are both dumb"],
    },
    {
      name: "Hollow Knight",
      messages: ["Great game", "I can't beat Absolute Radiance"],
    },
  ]);
};

seedDB().then(() => {
  mongoose.connection.close();
});
