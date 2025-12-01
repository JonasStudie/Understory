const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const db = new sqlite3.Database(path.join(__dirname, '..', 'mydb.sqlite'));

// Helper: send email
async function sendVerificationEmail(email, code) {
<<<<<<< Updated upstream
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'understory.foo@gmail.com', pass: 'xvfhtazjnsfhoowe' }
  });
  try {
    let info = await transporter.sendMail({
      from: 'understory.foo@gmail.com',
      to: email,
      subject: 'Din bekræftelseskode',
      text: `Din kode er: ${code}`
    });
    console.log('Verification email sent:', info.response);
  } catch (err) {
    console.error('Error sending verification email:', err);
  }
=======
  // Use your SMTP config here
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: 'understory.foo@gmail.com', pass: 'xvfhtazjnsfhoowe' }
  });
  await transporter.sendMail({
    from: 'understory.foo@gmail.com',
    to: email,
    subject: 'Din bekræftelseskode',
    text: `Din kode er: ${code}`
  });
>>>>>>> Stashed changes
}

// Middleware: require not logged in
function requireNotLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/review');
  }
  next();
}

// Middleware: require logged in
function requireLoggedIn(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
}

// GET login
router.get('/login', requireNotLoggedIn, (req, res) => {
  res.render('login');
});

// POST login
router.post('/login', requireNotLoggedIn, (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.render('login', { error: 'Forkert email eller adgangskode' });
<<<<<<< Updated upstream
    if (!user.is_verified) {
      // Generate new code and expiry
      const code = ('' + Math.floor(100000 + Math.random() * 900000));
      const expires = Date.now() + 5 * 60 * 1000;
      db.run('UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?', [code, expires, user.id], async (err2) => {
        if (!err2) await sendVerificationEmail(email, code);
        // Always redirect to verify page
        return res.redirect('/auth/verify?email=' + encodeURIComponent(email));
      });
      return;
    }
=======
    if (!user.is_verified) return res.redirect('/auth/verify?email=' + encodeURIComponent(email));
>>>>>>> Stashed changes
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.render('login', { error: 'Forkert email eller adgangskode' });
    req.session.userId = user.id;
    req.session.firstName = user.first_name;
<<<<<<< Updated upstream
    res.redirect('/');
=======
    res.redirect('/review');
>>>>>>> Stashed changes
  });
});

// GET register
router.get('/register', requireNotLoggedIn, (req, res) => {
  res.render('register');
});

// POST register
router.post('/register', requireNotLoggedIn, async (req, res) => {
  const { email, first_name, password } = req.body;
  if (!/^.{8,}$/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return res.render('register', { error: 'Adgangskoden skal være mindst 8 tegn, 1 stort bogstav og 1 tal.' });
  }
  const hash = await bcrypt.hash(password, 10);
  const code = ('' + Math.floor(100000 + Math.random() * 900000));
  const expires = Date.now() + 5 * 60 * 1000;
<<<<<<< Updated upstream
  // Insert user with is_verified=0, so user exists before verification
  db.run('INSERT INTO users (email, first_name, password_hash, is_verified, verification_code, verification_expires) VALUES (?, ?, ?, 0, ?, ?)',
    [email, first_name, hash, code, expires], async function(err) {
      if (err) return res.render('register', { error: 'Email findes allerede.' });
      await sendVerificationEmail(email, code);
=======
  db.run('INSERT INTO users (email, first_name, password_hash, verification_code, verification_expires) VALUES (?, ?, ?, ?, ?)',
    [email, first_name, hash, code, expires], async function(err) {
      if (err) return res.render('register', { error: 'Email findes allerede.' });
      await sendVerificationEmail(email, code);
      // Redirect to verify page with email in query
>>>>>>> Stashed changes
      res.redirect('/auth/verify?email=' + encodeURIComponent(email));
    });
});

// GET verify
router.get('/verify', requireNotLoggedIn, (req, res) => {
<<<<<<< Updated upstream
  // Save email in session for verification flow
  if (req.query.email) {
    req.session.verifyEmail = req.query.email;
  }
  res.render('verify', { email: req.session.verifyEmail });
=======
  res.render('verify', { email: req.query.email });
>>>>>>> Stashed changes
});

// POST verify
router.post('/verify', requireNotLoggedIn, (req, res) => {
<<<<<<< Updated upstream
  // Always use email from session for verification
  const email = req.session.verifyEmail;
  const code = req.body.code;
  if (!email) {
    return res.render('verify', { error: 'Email mangler', email: '' });
  }
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('DB error:', err);
      return res.render('verify', { error: 'Databasefejl', email });
    }
    if (!user) {
      return res.render('verify', { error: 'Bruger ikke fundet', email });
    }
=======
  const { email, code } = { email: req.query.email, code: req.body.code };
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) return res.render('verify', { error: 'Bruger ikke fundet', email });
>>>>>>> Stashed changes
    if (user.is_verified) return res.redirect('/auth/login');
    if (user.verification_code !== code) return res.render('verify', { error: 'Forkert kode', email });
    if (Date.now() > user.verification_expires) return res.render('verify', { error: 'Koden er udløbet', email });
    db.run('UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?', [user.id], err2 => {
      if (err2) return res.render('verify', { error: 'Fejl ved bekræftelse', email });
<<<<<<< Updated upstream
      // Clear session verifyEmail after success
      req.session.verifyEmail = null;
=======
      // After successful verification, redirect to login with a message
>>>>>>> Stashed changes
      res.render('login', { error: 'Din email er nu bekræftet. Log ind for at fortsætte.' });
    });
  });
});

// GET logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
