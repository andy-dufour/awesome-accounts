var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require ('mysql');
const util = require('util')
var fs = require('fs');
const nconf = require('nconf');

fs.writeFile("test.log", util.inspect(process.env, false, null), function(err) {
    if(err) {
        return console.log(err);
    }

    console.error("logged environment variables");
});

var config_file = process.env.APP_CONFIG || 'config/config.json';

nconf.file({ file: config_file });

var mysql_host = nconf.get('mysql')['host'];
var mysql_user = nconf.get('mysql')['user'];
var mysql_password = nconf.get('mysql')['password'];
var mysql_port = nconf.get('mysql')['port'];
var mysql_database = 'todos';

console.error("Connecting to mysql on host: " + mysql_host + ", port: " + mysql_port + ", user: " + mysql_user + ", password: " + mysql_password + ", database:" + mysql_database);

var con = mysql.createConnection({
	host: mysql_host,
	port: mysql_port,
	user: mysql_user,
	password: mysql_password,
	database: mysql_database
});

var nodemailer = require('nodemailer');

var account = require('./routes/account');
// var index = require('./routes/index');
// var users = require('./routes/users');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());//parse html,json parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  req.con = con;
  next();
});

app.use('/', account);//home
app.use('/account', account);

//catch 404 and forward to errorhandler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

app.listen(app.get('port'),'localhost');
