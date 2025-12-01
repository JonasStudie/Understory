var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var reviewRouter = require('./routes/review');
var authRouter = require('./routes/auth');
var registrationRouter = require('./routes/registration');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Require login for all routes except /auth/* and static files
app.use((req, res, next) => {
  if (!req.session || !req.session.userId) {
    if (
      req.path.startsWith('/auth') ||
      req.path.startsWith('/stylesheets') ||
      req.path.startsWith('/public')
    ) {
      return next();
    }
    return res.redirect('/auth/login');
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
// Middleware: require login for all except auth
app.use((req, res, next) => {
  if (!req.session || !req.session.userId) {
    if (!req.path.startsWith('/auth')) {
      return res.redirect('/auth/login');
    }
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  }
  next();
});

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
app.use('/auth', authRouter);
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
