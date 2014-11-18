'use strict';

var http = require('http'),
    fs   = require('fs'),
    port = process.env.PORT || 5000;

var serveStaticFile = function (res, path, contentType, responseCode) {
    if (!responseCode) responseCode = 200;

    fs.readFile(__dirname + path, function (err, data) {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 - Internal Error');
        }
        else {
            res.writeHead(responseCode, { 'Content-Type': contentType });
            res.end(data);
        }
    });
};

http.createServer(function (req, res) {
    // Normalize URL by removing query-string, optional trailing slash, and
    // making it lowercase.
    var path = req.url
        .replace(/\/?(?:\?.*)?$/, '')
        .toLowerCase();

    switch(path) {
        case '':
            serveStaticFile(res, '/public/home.html', 'text/html');
            break;

        case '/about':
            serveStaticFile(res, '/public/about.html', 'text/html');
            break;

        case '/img/logo.png':
            serveStaticFile(res, '/public/img/logo.png', 'image/png');
            break;

        default:
            serveStaticFile(res, '/public/notfound.html', 'text/html', 404);
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
