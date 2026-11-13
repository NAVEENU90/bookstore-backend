// import express
const express = require("express");
// import userController
const userController = require("./controller/userController");
// import bookController
const bookController = require("./controller/bookController");
const paymentController = require("./controller/paymentController");
const jwtMiddleware = require("./middleware/jwtMiddleware");
const jwtAdminMiddleware = require("./middleware/jwtAdminMiddleware");
// import multer config
const multerConfig = require("./middleware/multerMiddleware");

// create an instance

const route = new express.Router();

// path for register..
route.post("/register", userController.registerController);

// path for login..
route.post("/login", userController.loginController);

// path for Google login..
route.post("/google-login", userController.googleLoginController);

// path for the signed-in user's profile.
route.get("/profile", jwtMiddleware, userController.getProfileController);
route.patch(
  "/profile",
  jwtMiddleware,
  multerConfig.single("profileImage"),
  userController.updateProfileController,
);

// path for get home books.
route.get("/all-home-book", bookController.getHomeBookController);

// ---------------USer--------------------

// path for add book.
route.post(
  "/add-book",
  jwtMiddleware,
  multerConfig.array("uploadImages", 3),
  bookController.addBookController,
);

// path for all books.
route.get("/all-book", jwtMiddleware, bookController.getAllBookController);
route.get(
  "/all-user-book",
  jwtMiddleware,
  bookController.getAllUserBookController,
);
route.get(
  "/all-user-brought-book",
  jwtMiddleware,
  bookController.getAllUserBroughtBookController,
);
route.delete(
  "/user-book/:id",
  jwtMiddleware,
  bookController.deleteUserBookController,
);
route.post(
  "/create-checkout-session",
  jwtMiddleware,
  paymentController.createCheckoutSessionController,
);
route.post(
  "/make-payment",
  jwtMiddleware,
  bookController.makePaymentController,
);

// path to view a book.
route.get("/view-book/:id", bookController.getABookController);

// path for admin to get all books.
route.get(
  "/admin-all-books",
  jwtAdminMiddleware,
  bookController.getAllBookAdminController,
);
route.get(
  "/admin-all-users",
  jwtAdminMiddleware,
  userController.getAllUsersAdminController,
);
route.patch(
  "/admin-book/:id/approve",
  jwtAdminMiddleware,
  bookController.approveBookAdminController,
);

// routes export
module.exports = route;
