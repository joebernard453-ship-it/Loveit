const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

app.use(express.static('public'));
app.use(express.json());

// Status Route
app.get('/api/status', (req, res) => {
    res.json({ status: "Lovit Server is Live!", database: "Connected" });
});

// Upload Route
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, { resource_type: "video" });
    await pool.query(
      'INSERT INTO posts (video_url, caption) VALUES ($1, $2)', 
      [result.secure_url, req.body.caption || ""]
    );
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Feed Route
app.get('/posts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
