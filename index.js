'use strict';

var http = require('http'),
    port = process.env.PORT || 5000;

http.createServer(function (req, res) {
	// Normalize URL by removing query-string, optional trailing slash, and
	// making it lowercase.
	var path = req.url
		.replace(/\/?(?:\?.*)?$/, '')
		.toLowerCase();

	switch(path) {
		case '':
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('Homepage');
			break;

		case '/about':
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('About');
			break;

		default:
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('Not Found');
			break;
	}
}).listen(port);

console.log('Server started on localhost:%d', port);

/*
var express = require('express')
var app = express();

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
*/
