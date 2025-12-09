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

//funktionen limiterer antal requests til at undgå spam af anmeldelser
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 10, // maks 5 requests per IP inden for vinduet
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
    const id = req.params.id;

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

// POST /review/:id (med billedupload)
router.post('/:id', reviewLimiter, upload.single('image'), async (req, res, next) => {
  const eventId = req.params.id;
  const { first_name, experience_date, rating, comment } = req.body;

  try {
    let imageUrl = null;

    if (req.file) {
      const filePath = req.file.path;

      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'understory_reviews'
        });
        imageUrl = result.secure_url;
      } catch (cloudErr) {
        console.error('Cloudinary fejl:', cloudErr);
        // vi fortsætter uden billede
      }

      // prøv at rydde op uanset hvad
      try {
        await fs.unlink(filePath);
      } catch (fsErr) {
        console.warn('Kunne ikke slette lokal fil:', filePath, fsErr);
      }
    }

    await dbRun(
      `
      INSERT INTO event_reviews (event_id, first_name, experience_date, rating, comment, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [eventId, first_name, experience_date, rating, comment, imageUrl]
    );
    res.redirect('/review/' + eventId);
  } catch (err) {
    console.error('Fejl ved oprettelse af anmeldelse:', err);
    next(err);
  }
});


module.exports = router;