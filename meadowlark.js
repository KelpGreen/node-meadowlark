'use strict';

var express             = require('express'),
    expressHandlebars   = require('express-handlebars'),
    bodyParser          = require('body-parser'),
    formidable          = require('formidable'),
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

// bodyParser() is deprecated in Express 4.0.
//app.use(bodyParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

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

// Newsletter routes.
app.get('/newsletter', function (req, resp) {
    // We will learn about CSRF later.  For now, we just provide a dummy value.
    resp.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.post('/process', function (req, resp) {
    /* Non-AJAX form
    resp.redirect(303, '/thank-you');
    */
    console.log('Form       (from querystring):        %j', req.query.form);
    console.log('CSRF token (from hidden form field):  %j', req.body._csrf);
    console.log('Name       (from visible form field): %s', req.body.name);
    console.log('Email      (from visible form field): %s', req.body.email);
    // Is this called via AJAX?
    if (req.xhr || req.accepts('json,html') === 'json') {
        // If there were an error, we would send { error: 'error description'}.
        resp.send({ success: true });
    }
    else {
        // If there were an error, we would redirect to an error page.
        resp.redirect(303, '/thank-you');
    }
});

// Contest routes.
app.get('/contest/vacation-photo', function (req, resp) {
    var now = new Date();
    resp.render('contest/vacation-photo', {
        year:  now.getFullYear(),
        month: now.getMonth()
    });
});

app.post('/contest/vacation-photo/:year/:month', function (req, resp) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) {
            return resp.redirect(303, '/error');
        }
        console.log('received fields: %j', fields);
        console.log('received files:  %j', files);

        resp.redirect(303, '/thank-you');
    });
});

app.get('/thank-you', function (req, resp) {
    resp.render('thank-you');
});

// Testing/sample routes.
app.get('/jquery-test', function (req, resp) {
    resp.render('jquery-test');
});

app.get('/nursery-rhyme', function (req, resp) {
    resp.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function (req, resp) {
    resp.json({
        animal:     'squirrel',
        bodyPart:   'tail',
        adjective:  'bushy',
        noun:       'heck'
    });
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
