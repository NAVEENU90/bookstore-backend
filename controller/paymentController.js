const mongoose = require("mongoose");
const Stripe = require("stripe");
const books = require("../model/bookModel");

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return secretKey ? new Stripe(secretKey) : null;
};

const getClientUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

exports.createCheckoutSessionController = async (req, res) => {
  const { bookId } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json("Invalid book id");
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return res
      .status(503)
      .json("Stripe is not configured. Set STRIPE_SECRET_KEY in the backend environment.");
  }

  try {
    const book = await books.findOne({
      _id: bookId,
      status: /^approved$/i,
      $or: [{ brought: "" }, { brought: { $exists: false } }],
    });

    if (!book) {
      return res.status(404).json("This book is not available for purchase.");
    }

    if (book.userMail?.trim().toLowerCase() === req.payload.toLowerCase()) {
      return res.status(403).json("You cannot purchase your own book.");
    }

    const amount = Math.round(Number(book.dprice) * 100);
    if (!Number.isSafeInteger(amount) || amount < 50) {
      return res.status(400).json("This book has an invalid payment amount.");
    }

    const clientUrl = getClientUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.payload,
      client_reference_id: req.payload,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: book.title,
              description: `Book by ${book.author}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookId: book._id.toString(),
        buyerEmail: req.payload,
      },
      success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-error`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Could not create Stripe Checkout session", error);
    return res.status(500).json("Unable to start checkout. Please try again.");
  }
};
