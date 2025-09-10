const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
const MISSING_REF_POLICY = (process.env.MISSING_REF_POLICY || 'ignore').toLowerCase();

let collection;

client.connect().then(() => {
  const db = client.db('UserFeedback');
  collection = db.collection('feedback');
  console.log('Connected to MongoDB');
});

app.post('/submitFeedback', async (req, res) => {
  try {
    const {
      solution,
      rating,
      reasons,
      device_id,
      location,
      additionalComment,
      washroomId,
      browser, //
      hourOfDay,
    } = req.body;

    const refId = req.body.refId || req.query.refId || null;
    if (MISSING_REF_POLICY === 'error' && !refId) {
      return res
        .status(400)
        .json({ message: 'Missing required field in request. Pls recheck and submit the form' });
    }

    const timestamp = new Date();

    await collection.insertOne({
      solution,
      rating,
      reasons,
      additionalComment,
      device_id,
      location,
      washroomId,
      browser,
      hourOfDay,
      refId,
      timestamp,
    });

    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Insert Error', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// In your Express backend (Node.js)
app.get('/health', (req, res) => {
  res.status(200).send('✅ OK');
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
