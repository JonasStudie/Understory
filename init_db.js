const path = require('path');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'mydb.sqlite'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evnt_name TEXT,
    company_name TEXT,
    short_review TEXT
  )`);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    verification_expires INTEGER
  )`);
});

const events = [
  { evnt_name: 'Whisey Smagning', company_name: 'Copenhagen Distillery', short_review: 'Kom og smag Whiskey!'}, //tilføj billede URL senere
  { evnt_name: 'Gin Smagning', company_name: 'Copenhagen Distillery', short_review: 'Kom og smag Gin!'},
  { evnt_name: 'Destillations-workshop', company_name: 'Copenhagen Distillery', short_review: 'Kom og lav Gin eller Akvavit' },
];


db.serialize(() => {
  const dbStatement = db.prepare("INSERT INTO reviews (evnt_name, company_name, short_review) VALUES (?, ?, ?)");
  events.forEach(event => {
    dbStatement.run(event.evnt_name, event.company_name, event.short_review);
  });
  dbStatement.finalize(err => {
    if (err) {
      console.error("Error inserting data:", err);
    } else {
      console.log("Data inserted successfully");
    }

  });
});


db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS event_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      experience_date TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      image_url image,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES reviews(id)
    )
  `);
});

const reviews = [
  {event_id: 1, first_name: 'Oliver', experience_date: '2025-01-10', rating: 5, comment: 'Mega hyggelig smagning, god stemning og dygtig vært!', image_url: 'https://ik.imagekit.io/km2xccxuy/ORANGE_4d6b3bb99e_mTH1XBso2.png?tr=h-%2Cw-1500%2Cq-70%2Cdpr-auto%2Cc-fill'},
  {event_id: 1, first_name: 'Anna', experience_date: '2025-01-12', rating: 4, comment: 'Rigtig god oplevelse, men der måtte gerne have været lidt mere tid til spørgsmål.'},
  {event_id: 2, first_name: 'Mads', experience_date: '2025-02-01', rating: 5, comment: 'Gin-workshoppen var klasse, sjovt at blande sin egen gin.'},
  {event_id: 2, first_name: 'Lise', experience_date: '2025-02-03', rating: 4, comment: 'Godt udvalg af gin'},
  {event_id: 3, first_name: 'Sofie', experience_date: '2025-03-05', rating: 3, comment: 'Interessant, men lidt for teknisk til mig.'},
  {event_id: 3, first_name: 'Peter', experience_date: '2025-03-07', rating: 5, comment: 'Fantastisk workshop! Lærte en masse om destillation.'}
];

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO event_reviews (event_id, first_name, experience_date, rating, comment, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  reviews.forEach(r => {
    stmt.run(r.event_id, r.first_name, r.experience_date, r.rating, r.comment, r.image_url);
  });

  stmt.finalize(err => {
    if (err) {
      console.error('Error adding event_reviews data', err);
    } else {
      console.log('Succes adding event_reviews data');
    }
  });
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    event_date TEXT NOT NULL,
    sms_reminder INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES reviews(id)
  )`);
});

        db.close();