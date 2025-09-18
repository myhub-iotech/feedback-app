const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let refRoutes;
try {
  refRoutes = require('./refRoutes'); // <-- case-sensitive on Linux/Render
  app.use('/api/ref', refRoutes);
  console.log('[boot] refRoutes mounted');
} catch (e) {
  console.error('[boot] FAILED to mount refRoutes:', e);

  // Optional: temporary diagnostic endpoint so you don't get a 404
  app.get('/api/ref/validate', (_req, res) => {
    res.status(500).json({ ok: false, code: 'ROUTE_IMPORT_FAILED', message: String(e) });
  });
}

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
      additionalComment,
      device_id,
      location,
      washroomId,
      browser,
      hourOfDay,
      refId,
    } = req.body || {};

    console.log('[submit] start', {
      ip: req.ip,
      ua: req.headers['user-agent'],
      bodyKeys: Object.keys(req.body || {}),
    });

    // If you enforce a refId, keep this branch; otherwise leave as 'ignore'
    console.log('[submit] refId', { refId, missingRefPolicy: MISSING_REF_POLICY });
    if (MISSING_REF_POLICY === 'error' && !refId) {
      return res.json({
        ok: false,
        code: 'MISSING_REFID',
        message: 'Missing required field in request.',
      });
    }

    if (!collection) {
      return res
        .status(503)
        .json({ ok: false, code: 'DB_NOT_READY', message: 'Database not ready' });
    }

    const timestamp = new Date();

    console.log('[submit] insert', {
      rating,
      reasonsCount: Array.isArray(reasons) ? reasons.length : 0,
      location,
      washroomId,
      refId,
    });

    const result = await collection.insertOne({
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

    console.log('[submit] inserted', { id: String(result.insertedId) });

    return res.json({ ok: true, code: 'OK', data: { id: String(result.insertedId) } });
  } catch (err) {
    console.error('[submit] server error', err);
    return res
      .status(500)
      .json({ ok: false, code: 'SERVER_ERROR', message: 'Failed to submit feedback' });
  }
});

// In your Express backend (Node.js)
app.get('/health', (req, res) => {
  res.status(200).send('✅ OK');
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
