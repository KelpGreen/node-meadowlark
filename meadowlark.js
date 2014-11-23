'use strict';

var express             = require('express'),
    expressHandlebars   = require('express-handlebars'),
    bodyParser          = require('body-parser'),
    expressSession      = require('express-session'),
    formidable          = require('formidable'),   // HTTP form handling

    credentials         = require('./credentials'),
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

app.use(expressSession({
    secret:             credentials.cookieSecret,
    saveUninitialized:  true,   // default = true
    resave:             true    // default = true
}));

// bodyParser() is deprecated in Express 4.0.
//app.use(bodyParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.set('port', port);

app.use(function (req, resp, next) {
    // If there's a flash message, transfer it to the context.
    console.info('Transferring flash message to context: %j', req.session.flash);
    if (!resp.locals.flash) {
        resp.locals.flash = {};
    }
    resp.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

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
    // resp.locals.flash = {
    //     type:    'success',
    //     intro:   'OK!',
    //     message: 'Everything is working.'
    // };
    console.info('Rendering home');
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
// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
    cb();
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.get('/newsletter', function (req, resp) {
    // We will learn about CSRF later.  For now, we just provide a dummy value.
    resp.render('newsletter', { csrf: 'CSRF token goes here' });
});

app.post('/newsletter', function (req, resp) {
    var name  = req.body.name  || '',
        email = req.body.email || '';

    // Validate input.
    if(!email.match(VALID_EMAIL_REGEX)) {
        if (req.xhr) {
            return resp.json({ error: 'Invalid name email address.' });
        }
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was  not valid.',
        };
        return resp.redirect(303, '/newsletter/archive');
    }

    new NewsletterSignup({ name: name, email: email }).save(function(err){
        if (err) {
            if (req.xhr) {
                return resp.json({ error: 'Database error.' });
            }
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            };
            return resp.redirect(303, '/newsletter/archive');
        }
        if (req.xhr) {
            return resp.json({ success: true });
        }
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.',
        };
        return resp.redirect(303, '/newsletter/archive');
    });
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
    resp.locals.flash = {
        type:    'success',
        intro:   'You are signed up!',
        message: 'Everything is working.'
    };
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
    console.log('Express started at %s on http://localhost:%d',
        new Date().toISOString(),
        app.get('port'));
});
