import cors from "cors";
import express from "express";
import "dotenv/config";
import { MongoClient } from "mongodb";

// app.use(cors())
// app.use(express.json())

const app = express();
const PORT =  8000;

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
connectToMongoDB()

app.get("/", (req, res) => {
  res.send("Hello Paper Haven Server");
});

app.listen(PORT, () => {
  console.log(`Paper Haven app listening on  ${PORT}`);
});

export default app;