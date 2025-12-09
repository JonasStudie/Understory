const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'mydb.sqlite'));

// --- Helper-funktioner til Promises ---
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
      resolve(this); // this.lastID, this.changes hvis du får brug for det
    });
  });
}

// GET /registration/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).send('Ugyldigt event-id');
    }

    const row = await dbGet(
      'SELECT * FROM reviews WHERE id = ?',
      [id]
    );

    if (!row) {
      return res.status(404).send('Event ikke fundet');
    }

    res.render('registerevent', {
      title: 'Tilmelding',
      eventId: id,
      event: row
    });
  } catch (err) {
    next(err);
  }
});

// POST /registration/:id
router.post('/:id', async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId)) {
      return res.status(400).send('Ugyldigt event-id');
    }

    const { full_name, phone, email, event_date } = req.body;
    const sms_reminder = req.body.sms_reminder ? 1 : 0;

    await dbRun(
      `
      INSERT INTO registrations (
        event_id, 
        full_name, 
        phone, 
        email, 
        event_date, 
        sms_reminder
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        eventId,
        full_name || null,
        phone || null,
        email || null,
        event_date || null,
        sms_reminder
      ]
    );

    console.log('Ny tilmelding med sms_reminder =', sms_reminder);
    res.redirect('/review/' + eventId);
  } catch (err) {
    console.error('Fejl ved oprettelse af tilmelding:', err);
    next(err);
  }
});

module.exports = router;
