const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Opret SQLite database connection
const db = new sqlite3.Database(path.join(__dirname, '..', 'mydb.sqlite'));

// Simple promise-wrappers til sqlite3
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
      resolve(this); // this.lastID, this.changes hvis du skal bruge det
    });
  });
}

// SMTP config og transporter (oprettes kun hvis credentials findes)
const smtpUser =
  process.env.SMTP_USER ||
  process.env.TWILIO_EMAIL ||
  process.env.SMTP_EMAIL ||
  'understory.foo@gmail.com';

const smtpPass =
  process.env.SMTP_PASS ||
  process.env.SMTP_PASSWORD ||
  'xvfhtazjnsfhoowe';

let transporter = null;

if (smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass }
  });
} else {
  console.warn('SMTP credentials not set; verification emails will not be sent');
}

// Helper: send verification email
async function sendVerificationEmail(email, code) {
  if (!transporter) {
    console.warn('SMTP transporter not configured; skipping sending verification email for', email);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: smtpUser,
      to: email,
      subject: 'Din bekraeftelseskode',
      text: `Din kode er: ${code}`
    });
    console.log('Verification email sent:', info.response);
  } catch (err) {
    console.error('Error sending verification email:', err);
  }
}

// Middleware: kraever at man IKKE er logget ind
function requireNotLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/review');
  }
  next();
}

// GET /login
router.get('/login', requireNotLoggedIn, (req, res) => {
  res.render('login', { error: null });
});

// POST /login
router.post('/login', requireNotLoggedIn, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.render('login', { error: 'Forkert email eller adgangskode' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.render('login', { error: 'Forkert email eller adgangskode' });
    }

    // Hvis brugeren ikke er verificeret - generer ny kode og send mail
    if (!user.is_verified) {
      const code = '' + Math.floor(100000 + Math.random() * 900000);
      const expires = Date.now() + 5 * 60 * 1000;

      await dbRun(
        'UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?',
        [code, expires, user.id]
      );

      // Start mailen uden at blokere redirect
      sendVerificationEmail(email, code).catch((err) =>
        console.error('Error sending verification email:', err)
      );

      req.session.verifyEmail = email;
      return res.redirect('/auth/verify?email=' + encodeURIComponent(email));
    }

    // Bruger er verificeret - log ind
    req.session.userId = user.id;
    req.session.firstName = user.first_name;
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Der opstod en fejl. Proev igen.' });
  }
});

// GET /register
router.get('/register', requireNotLoggedIn, (req, res) => {
  res.render('register', { error: null });
});

// POST /register
router.post('/register', requireNotLoggedIn, async (req, res) => {
  const { email, first_name, password } = req.body;

  try {
    // Simpel password-validering
    if (!/^.{8,}$/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return res.render('register', {
        error: 'Adgangskoden skal vaere mindst 8 tegn, 1 stort bogstav og 1 tal.'
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const code = '' + Math.floor(100000 + Math.random() * 900000);
    const expires = Date.now() + 5 * 60 * 1000;

    await dbRun(
      'INSERT INTO users (email, first_name, password_hash, is_verified, verification_code, verification_expires) VALUES (?, ?, ?, 0, ?, ?)',
      [email, first_name, hash, code, expires]
    );

    // Start mailen uden at blokere redirect
    sendVerificationEmail(email, code).catch((err) =>
      console.error('Error sending verification email:', err)
    );

    req.session.verifyEmail = email;

    res.redirect('/auth/verify?email=' + encodeURIComponent(email));
  } catch (err) {
    console.error('Register error:', err);

    // Hvis du vil skelne unikt email constraint:
    if (err && err.code === 'SQLITE_CONSTRAINT') {
      return res.render('register', { error: 'Email findes allerede.' });
    }

    return res.render('register', { error: 'Der opstod en fejl. Proev igen.' });
  }
});

// GET /verify
router.get('/verify', requireNotLoggedIn, (req, res) => {
  // Gem email i session, hvis den kommer som query param
  if (req.query.email) {
    req.session.verifyEmail = req.query.email;
  }

  const email = req.session.verifyEmail || req.query.email || '';
  res.render('verify', { email, error: null });
});

// POST /verify
router.post('/verify', requireNotLoggedIn, async (req, res) => {
  const email = req.session.verifyEmail || req.body.email || req.query.email;
  const code = req.body.code;

  if (!email) {
    return res.render('verify', { error: 'Email mangler', email: '' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.render('verify', { error: 'Bruger ikke fundet', email });
    }
    if (user.is_verified) {
      return res.redirect('/auth/login');
    }
    if (user.verification_code !== code) {
      return res.render('verify', { error: 'Forkert kode', email });
    }
    if (Date.now() > user.verification_expires) {
      return res.render('verify', { error: 'Koden er udloebet', email });
    }

    await dbRun(
      'UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?',
      [user.id]
    );

    // Ryd verify-email i session
    req.session.verifyEmail = null;

    // Vis login-side med besked
    res.render('login', {
      error: 'Din email er nu bekraeftet. Log ind for at fortsætte.'
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.render('verify', { error: 'Databasefejl', email });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

// POST /delete - delete current user's account
router.post('/delete', async (req, res) => {
  const userId = req.session && req.session.userId;
  if (!userId) {
    return res.redirect('/auth/login');
  }

  try {
    await dbRun('DELETE FROM users WHERE id = ?', [userId]);

    // Destroy session and redirect to login
    req.session.destroy(() => {
      res.redirect('/auth/login');
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    // On error, keep the user logged in and show an error on the index
    res.status(500).render('index', { error: 'Kunne ikke slette kontoen. Prøv igen.' });
  }
});

module.exports = router;
