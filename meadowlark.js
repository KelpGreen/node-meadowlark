'use strict';

var express             = require('express'),
    expressHandlebars   = require('express-handlebars'),
    fortune             = require('./lib/fortune'),
    app                 = express(),
    port                = process.env.PORT || 3000,
    handlebars;

// Set up Handlebars view engine.
handlebars = expressHandlebars.create({
    defaultLayout: 'main',
    helpers : {
        section: function (name, options) {
            if(!this._sections) {
                this._sections = {};
            }
            this._sections[name] = options.fn(this);
            return null;
        },
    }
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

// mocked weather data
var getWeatherData = function () {
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
            },
        ],
    };
};

// Middleware to add weather data to context.
app.use(function (req, resp, next) {
    if (!resp.locals.partials) {
        resp.locals.partials = {};
    }
    resp.locals.partials.weather = getWeatherData();
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

app.get('/jquery-test', function (req, resp) {
    resp.render('jquery-test');
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
