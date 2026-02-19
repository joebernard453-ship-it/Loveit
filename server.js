const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render security
});
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

app.use(express.static('public'));
app.use(express.json());
app.get('/api/status', (req, res) => {
    res.json({ status: "Lovit Server is Live!", timestamp: new Date() });
});
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, { 
      resource_type: "video" 
    });
const videoUrl = result.secure_url;
    const caption = req.body.caption || "No caption";
    await pool.query(
      'INSERT INTO posts (video_url, caption) VALUES ($1, $2)', 
      [videoUrl, caption]
    );

    res.json({ success: true, url: videoUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).send('Upload Failed');
  }
});
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
  console.log(`Lovit Server is running on port ${PORT} and connected to Memory.`);
});
