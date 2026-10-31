import cors from "cors";
import express from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

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

// Add a new book
app.post("/add-book", async (req, res) => {
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
app.get("/all-books/:id", async (req, res) => {
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
app.put("/my-books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId, ...updatedData } = req.body;

    const result = await booksCollection.updateOne(
      { _id: new ObjectId(id), ownerId },
      { $set: updatedData }
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




// http://localhost:8000/add-book
// http://localhost:8000/all-books
app.get("/", (req, res) => {
  res.send("Hello Paper Haven Server");
});

app.listen(PORT, () => {
  console.log(`Paper Haven app listening on  ${PORT}`);
});

export default app;
