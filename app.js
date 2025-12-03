require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

const cloudinary = require('./config/cloudinary'); 

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var reviewRouter = require('./routes/review');
var authRouter = require('./routes/auth');
var registrationRouter = require('./routes/registration');
const { default: helmet } = require('helmet');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "https:"]
      },
    },
  })
);

// Gør kun review-popup.js tilgængelig som statisk fil
app.get('/js/review-popup.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'review-popup.js'));
});

// Session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Require login for all routes except a whitelist (auth, static, public pages)
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  // Only allow auth routes and static assets when not authenticated
  const isPublic = req.path.startsWith('/auth') ||
    req.path.startsWith('/stylesheets') ||
    req.path.startsWith('/public') ||
    req.path.startsWith('/favicon');

  if (isPublic) return next();

  return res.redirect('/auth/login');
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/review', reviewRouter);
app.use('/auth', authRouter);
app.use('/registration', registrationRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;