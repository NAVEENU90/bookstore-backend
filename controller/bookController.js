const books = require("../model/bookModel");
const mongoose = require("mongoose");
const Stripe = require("stripe");

// add book
exports.addBookController = async (req, res) => {
  console.log("inside addbook controller");
  const {
    title,
    author,
    noofpages,
    imageurl,
    price,
    dprice,
    abstract,
    publisher,
    language,
    isbn,
    category,
  } = req.body;

  console.log(
    title,
    author,
    noofpages,
    imageurl,
    price,
    dprice,
    abstract,
    publisher,
    language,
    isbn,
    category,
  );

  const uploadedImg = (req.files || []).map((item) => item.filename);

  console.log(uploadedImg);

  const email = req.payload;
  console.log(email);

  try {
    const existingBook = await books.findOne({ title, userMail: email });
    if (existingBook) {
      return res.status(401).json("You have already added the book");
    } else {
      const newBook = new books({
        title,
        author,
        noofpages,
        imageurl,
        price,
        dprice,
        abstract,
        publisher,
        language,
        isbn,
        category,
        uploadedImg,
        userMail: email,
        status:"pending"
      });
      await newBook.save();
      return res.status(200).json(newBook);
    }
  } catch (error) {
    return res.status(500).json(error);
  }
};

// get home books

exports.getHomeBookController = async (req, res) => {
  console.log("inside a controller");
  try {
    const homeBooks = await books.find().sort({ _id: -1 }).limit(4);
    res.status(200).json(homeBooks);
  } catch (err) {
    res.status(500).json(err);
  }
}

// get all books

exports.getAllBookController = async (req, res) => {
  try {
    const searchKey =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const query = { status: "approved" };

    if (searchKey) {
      query.title = {
        $regex: searchKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    const allBooks = await books.find(query);
    res.status(200).json(allBooks);
  } catch (err) {
    res.status(500).json(err);
  }
}

// Get books listed by the signed-in user
exports.getAllUserBookController = async (req, res) => {
  try {
    const userBooks = await books.find({ userMail: req.payload });
    return res.status(200).json(userBooks);
  } catch (err) {
    return res.status(500).json(err);
  }
};

// Get books brought by the signed-in user
exports.getAllUserBroughtBookController = async (req, res) => {
  try {
    const broughtBooks = await books.find({ brought: req.payload });
    return res.status(200).json(broughtBooks);
  } catch (err) {
    return res.status(500).json(err);
  }
};

exports.makePaymentController = async (req, res) => {
  const { sessionId } = req.body || {};
  if (typeof sessionId !== "string" || !/^cs_(test|live)_/.test(sessionId)) {
    return res.status(400).json("Invalid checkout session id");
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res
      .status(503)
      .json("Stripe is not configured. Set STRIPE_SECRET_KEY in the backend environment.");
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      session.client_reference_id !== req.payload ||
      session.metadata?.buyerEmail !== req.payload
    ) {
      return res.status(403).json("This checkout session does not belong to you.");
    }

    if (session.payment_status !== "paid") {
      return res.status(409).json("Payment has not been completed.");
    }

    const bookId = session.metadata?.bookId;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json("The checkout session has invalid book details.");
    }

    const purchasedBook = await books.findOneAndUpdate(
      {
        _id: bookId,
        status: /^approved$/i,
        userMail: { $ne: req.payload },
        $or: [{ brought: "" }, { brought: { $exists: false } }],
      },
      { $set: { brought: req.payload, status: "sold" } },
      { new: true },
    );

    if (purchasedBook) {
      return res.status(200).json(purchasedBook);
    }

    const existingPurchase = await books.findOne({
      _id: bookId,
      brought: req.payload,
      status: "sold",
    });
    if (existingPurchase) {
      return res.status(200).json(existingPurchase);
    }

    return res.status(409).json("This book is no longer available.");
  } catch (error) {
    console.error("Could not verify Stripe Checkout session", error);
    return res.status(500).json("Unable to verify the payment.");
  }
};

exports.deleteUserBookController = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json("Invalid book id");
  }

  try {
    const deletedBook = await books.findOneAndDelete({
      _id: id,
      userMail: req.payload,
    });

    if (!deletedBook) {
      return res.status(404).json("Book not found");
    }

    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// get a specific book

exports.getABookController = async (req, res) => {
  console.log("inside getABook controller");
  const {id} = req.params
  console.log(id)
  try {
    const aBook = await books.findOne({_id:id})
    res.status(200).json(aBook);
  } catch (err) {
    res.status(500).json(err);
  }
}


// Admin---------------------------------------------

// get all books for admin
exports.getAllBookAdminController = async (req, res) => {
  try {
    const allBooks = await books.find();
    return res.status(200).json(allBooks);
  } catch (err) {
    return res.status(500).json(err);
  }
};

exports.approveBookAdminController = async (req, res) => {
  try {
    const approvedBook = await books.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true, runValidators: true },
    );

    if (!approvedBook) {
      return res.status(404).json("Book not found");
    }

    return res.status(200).json(approvedBook);
  } catch (err) {
    return res.status(500).json(err);
  }
};