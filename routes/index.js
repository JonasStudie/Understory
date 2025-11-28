var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express123' });
});

/* GET phone page. */
router.get('/phone', function(req, res, next) {
  res.render('phone', { title: 'Phone Page' });
});

/* GET mail page. */
router.get('/mail', function(req, res, next) {
  res.render('mail', { title: 'Mail Page' });
});



module.exports = router;
