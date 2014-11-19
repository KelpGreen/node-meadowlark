'use strict';

var express             = require('express'),
    expressHandlebars   = require('express-handlebars'),
    fortune             = require('./lib/fortune'),
    app                 = express(),
    port                = process.env.PORT || 3000,
    handlebars;
    
// Set up Handlebars view engine.
handlebars = expressHandlebars.create({
    defaultLayout: 'main'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', port);

// Always server resources in /public tree.
app.use(express.static(__dirname + '/public'));

// Set 'showTests' context property if the query-string contains test=1.
app.use(function (req, resp, next) {
    resp.locals.showTests = app.get('env') !== 'production' &&
                            req.query.test === '1';
    next();
});

// ===== Routes =====
app.get('/', function (req, resp) {
    resp.render('home');
});

app.get('/about', function (req, resp) {
    resp.render('about', {
        fortune:        fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
});

app.get('/tours/hood-river', function (req, resp) {
    resp.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function (req, resp) {
    resp.render('tours/request-group-rate');
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
