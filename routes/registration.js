const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'mydb.sqlite'));

router.get('/:id', function(req, res, next) {
  const id = req.params.id;

  db.get('SELECT * FROM reviews WHERE id = ?', [id], (err, row) => {
    if (err) return next(err);
    if (!row) return res.status(404).send('Event ikke fundet');

    res.render('registerevent', {title: 'Tilmelding', eventId: id, event: row});
  });
});

router.post('/:id', function(req, res, next) {
  const eventId = req.params.id;
  const { full_name, phone, email, event_date } = req.body;

  // Checkbox: hvis checked → '1', ellers undefined
  const sms_reminder = req.body.sms_reminder ? 1 : 0;

  db.run(`
    INSERT INTO registrations (event_id, full_name, phone, email, event_date, sms_reminder)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [eventId, full_name, phone, email, event_date, sms_reminder], function(err) {
    if (err) {
      console.error(err);
      return next(err);
    }

    console.log('Ny tilmelding med sms_reminder =', sms_reminder);
    res.redirect('/review/' + eventId);
  });
});



module.exports = router;