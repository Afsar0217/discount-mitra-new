require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL DB setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create bookings table if not exists
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    bookedBy TEXT,
    bookedFor TEXT,
    phone TEXT,
    service TEXT,
    vendor TEXT,
    category TEXT,
    subcategory TEXT,
    timestamp TEXT
  )
`;
pool.query(createTableQuery)
  .then(() => console.log('Connected to PostgreSQL and ensured bookings table exists'))
  .catch((err) => console.error('DB Error:', err));

// API endpoint to save booking
app.post('/api/bookings', async (req, res) => {
  const { bookedBy, bookedFor, phone, service, vendor, category, subcategory, timestamp } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO bookings (bookedBy, bookedFor, phone, service, vendor, category, subcategory, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [bookedBy, bookedFor, phone, service, vendor, category, subcategory, timestamp]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Insert Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API endpoint to get all bookings
app.get('/api/bookings', async (req, res) => {
  console.log('GET /api/bookings - Request received');
  try {
    console.log('Attempting to query database...');
    const result = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
    console.log('Query successful, rows:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('Get bookings error - Full details:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});