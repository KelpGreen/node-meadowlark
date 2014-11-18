'use strict';

var express 			= require('express'),
	expressHandlebars 	= require('express-handlebars'),
	app     			= express(),
	port    			= process.env.PORT || 3000,
	handlebars;

// Set up Handlebars view engine.
handlebars = expressHandlebars.create({
	defaultLayout: 'main'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', port);

app.get('/', function (req, resp) {
	resp.render('home');
});

app.get('/about', function (req, resp) {
	resp.render('about');
});

// Custom 404 page.
app.use(function (req, resp) {
	resp.status(404);
	resp.render('404');
});

// Custom 505 page.
app.use(function (err, req, resp /* , next */) {
	console.error(err.stack);
	resp.status('500');
	resp.render('500');
});

app.listen(app.get('port'), function () {
	console.log('Express started on http://localhost:%d',
		app.get('port'));
});
