const users = require("../model/userModel");
var jwt = require("jsonwebtoken");
// register
exports.registerController = async (req, res) => {
  // logic
  const { username, email, password } = req.body;
  console.log(username, email, password);
  try {
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      res.status(400).json("Already existing user...");
    } else {
      const newUser = new users({
        username,
        email,
        password,
      });
      await newUser.save(); //mongodb save
      res.status(200).json(newUser);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

//login
exports.loginController = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      if (existingUser.password == password) {
        const token = jwt.sign({ userMail: existingUser.email }, "secretKey");
        console.log(token);
        res.status(200).json({ existingUser, token });
      } else {
        res.status(401).json("Password Doesnot Match!!!");
      }
    } else {
      res.status(404).json("User Doesnot Exist!!!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

//login
exports.googleLoginController = async (req, res) => {
  const { username, email, password, profile } = req.body;
  console.log(username, email, password, profile);
  try {
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      const token = jwt.sign({ userMail: existingUser.email }, "secretKey");
      res.status(200).json({ existingUser, token }); 
    } else {
      const newUser = new users({
        username,
        email,
        password,
        profile,
      });
      await newUser.save(); //mongodb save
      const token = jwt.sign({ userMail: newUser.email }, "secretKey");
      res.status(200).json({ existingUser: newUser, token });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getProfileController = async (req, res) => {
  try {
    const user = await users.findOne({ email: req.payload }).select("-password");
    if (!user) {
      return res.status(404).json("User Doesnot Exist!!!");
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json(err);
  }
};

exports.updateProfileController = async (req, res) => {
  const updates = {};

  if (typeof req.body.username === "string") {
    const username = req.body.username.trim();
    if (!username) {
      return res.status(400).json("Username is required");
    }
    updates.username = username;
  }

  if (typeof req.body.bio === "string") {
    updates.bio = req.body.bio.trim();
  }

  if (typeof req.body.password === "string" && req.body.password) {
    updates.password = req.body.password;
  }

  if (req.file) {
    updates.profile = `/upload/${encodeURIComponent(req.file.filename)}`;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json("No profile changes provided");
  }

  try {
    const user = await users
      .findOneAndUpdate({ email: req.payload }, { $set: updates }, {
        new: true,
        runValidators: true,
      })
      .select("-password");

    if (!user) {
      return res.status(404).json("User Doesnot Exist!!!");
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json(err);
  }
};

exports.getAllUsersAdminController = async (req, res) => {
  try {
    const allUsers = await users
      .find()
      .select("-password")
      .sort({ username: 1 });
    return res.status(200).json(allUsers);
  } catch (err) {
    return res.status(500).json(err);
  }
};
