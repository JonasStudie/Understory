const express = require('express');
const router = express.Router();
const twilio = require('twilio');
require('dotenv').config();

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// Helper middleware: require login for sider der skal beskyttes
function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
}

/* GET home page. */
router.get('/', requireLogin, (req, res) => {
  const name = req.session && req.session.firstName ? req.session.firstName : 'user';
  res.render('index', { title: `Velkommen ${name}!` });
});

/* GET phone page. */
router.get('/phone', (req, res) => {
  res.render('phone', { title: 'Phone Page' });
});

/* POST send message via Twilio */
router.post('/send-message', async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).send('Name and phone number are required');
  }

  try {
    await client.messages.create({
      body: `Hej ${name}, velkommen til Understory! Vi er glade for at have dig med. Klik på linket for at komme i gang: `,
      from: twilioPhoneNumber,
      to: phone
    });

    res.render('success', { phoneNumber: phone });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Error sending message: ' + error.message);
  }
});

module.exports = router;
