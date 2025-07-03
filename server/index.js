const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let collection;

client.connect().then(() => {
  const db = client.db("UserFeedback");
  collection = db.collection("feedback");
  console.log("Connected to MongoDB");
});

app.post("/submitFeedback", async (req, res) => {
  try {
    const { rating, reasons, device_id, location } = req.body;
    const timestamp = new Date();
    await collection.insertOne({
      rating,
      reasons,
      device_id,
      location,
      timestamp,
    });
    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Insert Error", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
