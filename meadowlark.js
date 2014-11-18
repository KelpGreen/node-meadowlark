'use strict';

var express = require('express'),
	app     = express(),
	port    = process.env.PORT || 3000;

app.set('port', port);

app.get('/', function (req, resp) {
	resp.type('text/plain');
	resp.send('Meadowlark Travel');
});

app.get('/about', function (req, resp) {
	resp.type('text/plain');
	resp.send('About Meadowlark Travel');
});

// Custom 404 page.
app.use(function (req, resp) {
	resp.type('text/plain');
	resp.status(404);
	resp.send('404 - Not Found');
});

// Custom 505 page.
app.use(function (err, req, resp /* , next */) {
	console.error(err.stack);
	resp.type('text/plain');
	resp.status('500');
	resp.send('500 - Server Error');
});

app.listen(app.get('port'), function () {
	console.log('Express started on http://localhost:%d',
		app.get('port'));
});
