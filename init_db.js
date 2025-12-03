const path = require('path');
const { image } = require('./config/cloudinary');
const { faker } = require('@faker-js/faker');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'mydb.sqlite'));

// --- REVIEWS (events-oversigten) ---
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
  { evnt_name: 'Whisey Smagning', company_name: 'Copenhagen Distillery', short_review: 'Kom og smag Whiskey!' },
  { evnt_name: 'Gin Smagning', company_name: 'Copenhagen Distillery', short_review: 'Kom og smag Gin!' },
  { evnt_name: 'Destillations-workshop', company_name: 'Copenhagen Distillery', short_review: 'Kom og lav Gin eller Akvavit' },
];

db.serialize(() => {
  const dbStatement = db.prepare(
    'INSERT INTO reviews (evnt_name, company_name, short_review) VALUES (?, ?, ?)'
  );
  events.forEach(event => {
    dbStatement.run(event.evnt_name, event.company_name, event.short_review);
  });
  dbStatement.finalize(err => {
    if (err) {
      console.error('Error inserting data into reviews:', err);
    } else {
      console.log('Data inserted successfully into reviews');
    }
  });
});

// --- EVENT_REVIEWS (detaljerede anmeldelser) ---
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

// Faker-baseret seeding til event_reviews
const IMAGES_BY_EVENT = {
  1: [
    'https://ik.imagekit.io/km2xccxuy/raw_logo_398343ea96_zNT61P17W.png?tr=h-%2Cw-1500%2Cq-70%2Cdpr-auto%2Cc-fill',
    'https://files.guidedanmark.org/files/382/259725_Copenhagen_Distillery__Mellanie_Gand.jpg'
  ],
  2: [
    'https://ik.imagekit.io/km2xccxuy/ORANGE_4d6b3bb99e_mTH1XBso2.png?tr=h-%2Cw-1500%2Cq-70%2Cdpr-auto%2Cc-fill',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuEm76QCBhGGAo9NbTRy01Y8QaVWNl2x1hoQ&s'
  ],
  3: [
    'https://www.copenhagendistillery.com/wp-content/uploads/2020/11/Copenhagen-Distillery-Interior-5-1.jpg',
    'https://ik.imagekit.io/km2xccxuy/01_3000x2000_825a4724c3_0_fYtQd8p.png?tr=h-%2Cw-1500%2Cq-70%2Cdpr-auto%2Cc-fill'
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate2025() {
  const month = faker.number.int({ min: 1, max: 3 }); // jan–mar
  const day = faker.number.int({ min: 1, max: 28 });
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `2025-${m}-${d}`;
}

db.serialize(() => {
  // juster her hvor hårdt du vil teste:
  const TOTAL_PER_EVENT = 100; // 3 * 500 = 1500 anmeldelser

  const stmt = db.prepare(`
    INSERT INTO event_reviews (event_id, first_name, experience_date, rating, comment, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  [1, 2, 3].forEach(eventId => {
    for (let i = 0; i < TOTAL_PER_EVENT; i++) {
      const firstName = faker.person.firstName();
      const experienceDate = randomDate2025();
      const rating = faker.number.int({ min: 1, max: 5 });
      const comment = faker.lorem.sentence({ min: 6, max: 14 });
      const imageUrl = pickRandom(IMAGES_BY_EVENT[eventId]);

      stmt.run(eventId, firstName, experienceDate, rating, comment, imageUrl);
    }
  });

  stmt.finalize(err => {
    if (err) {
      console.error('Error adding faker event_reviews data', err);
    } else {
      console.log('Success adding faker event_reviews data');
    }
  });
});

// --- REGISTRATIONS ---
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
console.log('Database initialized successfully.');