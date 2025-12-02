const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
// cloudinary opsætning
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // bruges som midlertidig mappe
const cloudinary = require('../config/cloudinary');


const db = new sqlite3.Database(path.join(__dirname, '..', 'mydb.sqlite'));


router.get('/', function(req, res, next) {
  db.all(`
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
  `, [], (err, rows) => {
    if (err) {
      console.error(err);
      return next(err);
    }


    res.render('review', {
      title: 'Review Page',
      reviews: rows
    });
  });
});

router.get('/:id', function(req, res, next) {
  const id = req.params.id;

  db.get('SELECT * FROM reviews WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return next(err);
    }

    if (!row) {
      return res.status(404).send('Begivenhed ikke fundet');
    }

    db.all(
      'SELECT * FROM event_reviews WHERE event_id = ? ORDER BY created_at DESC',
      [id],
      (err2, reviewRows) => {
        if (err2) {
          console.error(err2);
          return next(err2);
        }

        res.render('watch_reviews', {
          title: 'Review Detail',
          review: row,
          eventReviews: reviewRows,
          firstName: req.session.firstName,
          user: req.session
        });
      }
    );
  });
});

router.post('/:id', upload.single('image'), function(req, res, next) {
  const eventId = req.params.id;
  const { first_name, experience_date, rating, comment } = req.body;

  console.log('Modtog anmeldelse for event', eventId);
  console.log('Body:', req.body);
  console.log('File:', req.file);

  function insertReview(imageUrl) {
    db.run(
      `
      INSERT INTO event_reviews (event_id, first_name, experience_date, rating, comment, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [eventId, first_name, experience_date, rating, comment, imageUrl],
      function(err) {
        if (err) {
          console.error('Fejl ved insertReview:', err);
          return next(err);
        }

        console.log('Ny anmeldelse indsat med id:', this.lastID, 'imageUrl=', imageUrl);
        res.redirect('/review/' + eventId);
      }
    );
  }

  if (!req.file) {
    console.log('Ingen fil uploadet, gemmer anmeldelse uden billede');
    insertReview(null);
    return;
  }

  const filePath = req.file.path;
  console.log('Uploader til Cloudinary fra path:', filePath);

  cloudinary.uploader.upload(filePath, { folder: 'understory_reviews' })
    .then(result => {
      const imageUrl = result.secure_url;
      console.log('Cloudinary upload OK, url:', imageUrl);
      insertReview(imageUrl);
    })
    .catch(err => {
      console.error('Cloudinary upload fejlede:', err);
      insertReview(null); // fallback uden billede
    });
});


module.exports = router;
