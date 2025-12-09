const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises; // bruger promise-versionen af fs

const db = new sqlite3.Database(path.join(__dirname, '..', 'mydb.sqlite'));

// Funktionen limiterer antal requests til at undgå spam af anmeldelser
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 10, // maks 10 requests per IP inden for vinduet
  message: "For mange anmeldelser fra denne IP, prøv igen senere."
});

// Små helper-funktioner der laver sqlite3 om til Promises
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this); // this.lastID, this.changes
    });
  });
}

// GET /review
router.get('/', async (req, res, next) => {
  try {
    const rows = await dbAll(`
      SELECT 
        r.id,
        r.evnt_name,
        r.company_name,
        r.short_review,
        ROUND(AVG(er.rating), 1) AS avg_rating,
        COUNT(er.id) AS review_count
      FROM reviews r
      LEFT JOIN event_reviews er ON r.id = er.event_id
      GROUP BY r.id
    `);

    res.render('review', {
      title: 'Anmeldelser',
      reviews: rows
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// GET /review/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).send('Ugyldigt ID');
    }

    const review = await dbGet(
      'SELECT * FROM reviews WHERE id = ?',
      [id]
    );

    if (!review) {
      return res.status(404).send('Begivenhed ikke fundet');
    }

    const eventReviews = await dbAll(
      'SELECT * FROM event_reviews WHERE event_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.render('watch_reviews', {
      title: 'Review Detail',
      review,
      eventReviews,
      firstName: req.session.firstName,
      user: req.session
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// GET /review/:id/average - returnerer gennemsnitsrating som JSON
router.get('/:id/average', async (req, res) => {
  const eventId = req.params.id;

  try {
    const row = await dbGet(
      `SELECT AVG(rating) AS avg_rating FROM event_reviews WHERE event_id = ?`,
      [eventId]
    );

    const avg = row && row.avg_rating ? Number(row.avg_rating).toFixed(1) : null;
    res.json({ average: avg });
  } catch (err) {
    console.error('Fejl ved hentning af gennemsnit:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// POST /review/:id (med billedupload)
router.post('/:id', reviewLimiter, upload.single('image'), async (req, res, next) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId)) {
    return res.status(400).send('Ugyldigt ID');
  }

  const { first_name, experience_date, rating, comment } = req.body;
  let imageUrl = null;
  const filePath = req.file?.path;

  try {
    // Upload billede til Cloudinary, hvis et billede er sendt med
    if (filePath) {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'understory_reviews'
        });
        imageUrl = result.secure_url;
      } catch (cloudErr) {
        console.error('Cloudinary fejl:', cloudErr);
        // vi fortsætter uden billede
      }
    }

    const numericRating = rating ? Number(rating) : null;

    await dbRun(
      `
      INSERT INTO event_reviews (
        event_id, 
        first_name, 
        experience_date, 
        rating, 
        comment, 
        image_url
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        eventId,
        first_name || null,
        experience_date || null,
        numericRating,
        comment || null,
        imageUrl
      ]
    );

    res.redirect('/review/' + eventId);
  } catch (err) {
    console.error('Fejl ved oprettelse af anmeldelse:', err);
    next(err);
  } finally {
    // prøv at rydde op uanset hvad
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (fsErr) {
        console.warn('Kunne ikke slette lokal fil:', filePath, fsErr);
      }
    }
  }
});

module.exports = router;
