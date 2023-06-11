var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var converter = require("json-2-csv");
var multer = require("multer");
var uuidv4 = require("uuid");
var UserModel = require("./mongo");
const PORT = process.env.PORT || 8000;
const DIR = "./public/";

var app = express();
const ConnectDb = async () => {
  await mongoose
    .connect(
      "mongodb+srv://Shivangi1010:shivangi10@cluster0.wxfe922.mongodb.net/?retryWrites=true&w=majority"
    )
    .then(() => console.log("db connected"));

  app.listen(PORT);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, uuidv4.v4() + "-" + fileName);
  },
});

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});

app.use("/public", express.static("public"));
app.use("/", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  res.setHeader("Content-type", "application/json");
  let users;
  if (req.query.search) {
    users = await UserModel.find(
      {
        $or: [
          {
            firstname: { $regex: req.query.search, $options: "i" },
          },
          {
            lastname: { $regex: req.query.search, $options: "i" },
          },
          {
            email: { $regex: req.query.search, $options: "i" },
          },
        ],
      },
      null
    );
  } else {
    users = await UserModel.find({}, null);
  }
  res.send({ users: users });
});

app.get("/export", async (req, res) => {
  const search = req.query.search ? req.query.search : ".*";
  users = await UserModel.aggregate([
    {
      $match: {
        $or: [
          {
            firstname: { $regex: search, $options: "i" },
          },
          {
            lastname: { $regex: search, $options: "i" },
          },
          {
            email: { $regex: search, $options: "i" },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        firstname: 1,
        lastname: 1,
        email: 1,
        mobile: 1,
        gender: 1,
        status: 1,
        location: 1,
      },
    },
  ]);
  const data = await converter.json2csv(users);
  res.attachment("users.csv");
  res.status(200).send(data);
});

app.get("/view", async (req, res) => {
  res.setHeader("Content-type", "application/json");
  const user = await UserModel.findOne({ _id: req.query._id });
  res.send({ user: user });
});

app.post("/form", upload.single("profileImg"), async (req, res) => {
  const url = req.protocol + "://" + req.get("host");
  res.setHeader("Content-type", "application/json");
  if (req.body) {
    if (req.query._id) {
      const user = {
        firstname: req.body["firstname"],
        lastname: req.body["lastname"],
        email: req.body["email"],
        mobile: req.body["mobile"],
        gender: req.body["gender"],
        status: req.body["status"],
        location: req.body["location"],
      };
      if (req.file) {
        user["profile"] = url + "/public/" + req.file.filename;
      }
      await UserModel.findByIdAndUpdate(req.query._id, user);

      res.status(200).send(" user edited successfully");
    } else {
      const user = new UserModel({
        firstname: req.body["firstname"],
        lastname: req.body["lastname"],
        email: req.body["email"],
        mobile: req.body["mobile"],
        gender: req.body["gender"],
        status: req.body["status"],
        profile: req.file
          ? url + "/public/" + req.file.filename
          : url + "/public/default.png",
        location: req.body["location"],
      });
      await user.save();
      res.status(200).send("new user saved successfully");
    }
  } else {
    res.status(404).send("user not saved");
  }
});

app.delete("/delete", async (req, res) => {
  if (req.body) {
    await UserModel.findByIdAndDelete(req.body.id);
    res.status(200).send("user deleted successfully");
  } else {
    res.status(200).send("user not found");
  }
});
ConnectDb();
