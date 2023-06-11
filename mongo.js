const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;

const UsersSchema = new Schema({
  objectId: ObjectId,
  firstname: String,
  lastname: String,
  gender: String,
  email: String,
  status: String,
  location: String,
  mobile: Number,
  profile: String,
});

const UserModel = mongoose.model("Users", UsersSchema);
module.exports = UserModel;
