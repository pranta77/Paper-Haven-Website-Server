import cors from "cors";
import express from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("Paper-Haven");
const booksCollection = db.collection("AddBooks");
const borrowsCollection = db.collection("borrows");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );
  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error!" });
  }
};

// Add a new book
app.post("/add-book", verifyToken, async (req, res) => {
  try {
    const book = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await booksCollection.insertOne(book);

    res.send({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});
// Add a latest books API
app.get("/latest-books", async (req, res) => {
  try {
    const books = await booksCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.send(books);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// Show a All book
app.get("/all-books", async (req, res) => {
  try {
    const books = await booksCollection.find().toArray();

    res.send({
      success: true,
      books,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// Get book details by ID
app.get("/all-books/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await booksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).send({
        message: "Book not found",
      });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({
      message: "Invalid book ID",
    });
  }
});
// -----------------------
app.get("/my-books/:ownerId", async (req, res) => {
  try {
    const books = await booksCollection
      .find({ ownerId: req.params.ownerId })
      .toArray();

    res.send(books);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch books" });
  }
});
// ---------------------------
app.put("/my-books/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId, ...updatedData } = req.body;

    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id), ownerId },
      { $set: updatedData },
    );

    if (!result.matchedCount) {
      return res.status(404).send({ message: "Book not found" });
    }

    res.send({ success: true, message: "Book updated successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// -----------------------------
app.delete("/my-books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.body;

    const result = await booksCollection.deleteOne({
      _id: new ObjectId(id),
      ownerId,
    });

    if (!result.deletedCount) {
      return res.status(404).send({ message: "Book not found" });
    }

    res.send({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// POST — Borrow a book
app.post("/borrow-book", async (req, res) => {
  try {
    const { bookId, userEmail } = req.body;

    const book = await booksCollection.findOne({
      _id: new ObjectId(bookId),
    });

    if (!book) {
      return res.status(404).send({ message: "Book not found" });
    }

    const borrowDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 14);

    const borrow = {
      bookId,
      bookTitle: book.title,
      bookImage: book.image,
      userEmail,
      borrowDate,
      returnDate,
    };

    const result = await borrowsCollection.insertOne(borrow);

    res.send({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// GET — Get a user's borrowed books
app.get("/my-borrows/:email", async (req, res) => {
  try {
    const borrows = await borrowsCollection
      .find({ userEmail: req.params.email })
      .toArray();

    res.send(borrows);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// DELETE — Return a book
app.delete("/my-borrows/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const result = await borrowsCollection.deleteOne({
      _id: new ObjectId(id),
      userEmail,
    });

    if (!result.deletedCount) {
      return res.status(404).send({ message: "Borrow record not found" });
    }

    res.send({ success: true, message: "Book returned successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// http://localhost:8000/add-book
// http://localhost:8000/all-books
app.get("/", (req, res) => {
  res.send("Hello Paper Haven Server");
});

app.listen(PORT, () => {
  console.log(`Paper Haven app listening on  ${PORT}`);
});

export default app;
