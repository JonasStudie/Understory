const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
      title: 'Anmeldelser',
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

router.post('/:id', function(req, res, next) {
  const eventId = req.params.id;
  const { first_name, experience_date, rating, comment } = req.body;

  db.run(
    `
    INSERT INTO event_reviews (event_id, first_name, experience_date, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `,
    [eventId, first_name, experience_date, rating, comment],
    function(err) {
      if (err) {
        console.error(err);
        return next(err);
      }

      console.log('Ny anmeldelse indsat med id:', this.lastID);
      res.redirect('/review/' + eventId);
    }
  );
});




module.exports = router;
