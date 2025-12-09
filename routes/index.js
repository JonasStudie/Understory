var express = require('express');
var router = express.Router();
var twilio = require('twilio');
require('dotenv').config();

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/* GET home page. */
router.get('/', function(req, res, next) {
  // Require login for home page
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }
<<<<<<< HEAD
  next();
}

/* GET home page. */
router.get('/', requireLogin, (req, res) => {
  const name = req.session && req.session.firstName ? req.session.firstName : 'user';
  res.render('index', { title: `Velkommen ${name}!` });
=======
  res.render('index', { title: 'Express123' });
>>>>>>> 25e85696d29b4bc2a74b8a63786abf9a624577b2
});

/* GET phone page. */
router.get('/phone', function(req, res, next) {
  res.render('phone', { title: 'Phone Page' });
});

<<<<<<< HEAD
=======
/* GET mail page. */
router.get('/mail', function(req, res, next) {
  res.render('mail', { title: 'Mail Page' });
});

>>>>>>> 25e85696d29b4bc2a74b8a63786abf9a624577b2
/* POST send message via Twilio */
router.post('/send-message', function(req, res, next) {
  const { name, phone } = req.body;
  
  if (!name || !phone) {
    return res.status(400).send('Name and phone number are required');
  }

  client.messages
    .create({
      body: `Hej ${name}, velkommen til Understory! Vi er glade for at have dig med. Klik på linket for at komme i gang: `,
      from: twilioPhoneNumber,
      to: phone
    })
    .then(message => {
      res.render('success', { phoneNumber: phone });
    })
    .catch(error => {
      console.error('Error sending message:', error);
      res.status(500).send('Error sending message: ' + error.message);
    });
});

module.exports = router;
