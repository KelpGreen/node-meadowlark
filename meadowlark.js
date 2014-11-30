'use strict';

var //connect                     = require('connect'),
    express                     = require('express'),
    expressHandlebars           = require('express-handlebars'),
    bodyParser                  = require('body-parser'),
    cluster                     = require('cluster'),
    domain                      = require('domain'),
    expressLogger               = require('express-logger'),    // supports daily log rotation
    expressSession              = require('express-session'),
    formidable                  = require('formidable'),        // HTTP form handling
    http                        = require('http'),
    morgan                      = require('morgan'),            // colorful dev logging
    path                        = require('path'),

    cartValidation              = require('./lib/cartValidation'),
    credentials                 = require('./credentials'),
    db                          = require('./models/db'),
    fortune                     = require('./lib/fortune'),
    postgresDb                  = require('./models/postgres-db'),
    Vacation                    = require('./models/vacation'),
    VacationInSeasonListener    = require('./models/vacationInSeasonListener'),

    app                         = express(),
    port                        = process.env.PORT || 3000,
    handlebars, server;

console.info('Execution environment: %j', app.get('env'));

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

// Use domains for more robust error-handling.
app.use(function (req, resp, next) {
    // Create a domain for this request.
    var domain2 = domain.create();

    // Handle errors on this domain.
    domain2.on('error', function (err) {
        var worker;

        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // Failsafe shutdown in 5 seconds.
            setTimeout(function () {
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);

            // Disconnect from the cluster.
            worker = cluster.worker;
            if (worker) {
                worker.disconnect();
            }

            // Stop taking new requests.
            server.close();

            try {
                // Attempt to use Express error route.
                next(err);
            }
            catch (err2) {
                // Express route failed, so try plain NodeJS response.
                console.error('Express error mechanism failed.\n', err2.stack);
                resp.statusCode = 500;
                resp.setHeader('content-type', 'text/plain');
                resp.end('Server error.');
            }
        }
        catch (err3) {
            console.error('Unable to send 500 response.\n', err3.stack);
        }
    });

    // Add the request and response objects to the domain.
    domain2.add(req);
    domain2.add(resp);

    // Execute the rest of the request chain in the domain.
    domain2.run(next);
});

// Logging.
switch (app.get('env')) {
    case 'development':
        app.use(morgan('dev'));
        break;
    case 'production':
        app.use(expressLogger({
            path: path.join(__dirname, '/log/requests.log')
        }));
        break;
}

// I moved the other DB stuff into models/db.js, but I'm not sure where to put this
// Mongo sessions stuff....
// Open database, initializing it if necessary.
db.init(app.get('env'), credentials);
postgresDb.init(app.get('env'), credentials);
app.use(expressSession({
    //store:              db.sessionStore,
    store:              postgresDb.sessionStore,
    secret:             credentials.cookieSecret,
    saveUninitialized:  false,   // default = true
    resave:             false    // default = true
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
    //console.info('Transferring flash message to context: %j', req.session.flash);
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
                name        : 'Portland',
                forecastUrl : 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl     : 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather     : 'Overcast',
                temp        : '54.1 F (12.3 C)',
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

var convertFromUSD = function (value, currency) {
    switch (currency) {
        case 'USD': return value * 1.0;
        case 'GBP': return value * 0.6;
        case 'BTC': return value * 0.0023707918444761;  // BitCoin 
        default:    return NaN;
    }
};

// Vacation routes.
app.get('/vacations', function (req, resp, next) {
    Vacation.find({ available: true }, function (err, vacations) {
        var context, currency;

        if (err) {
            console.error('Error finding vacations: %j', err);
            next(err);
        }
        console.info('Found %d vacations', vacations.length);

        currency = req.session.currency || 'USD';
        context = {
            currency:  currency,
            vacations: vacations.map(function (vacation) {
                var localCurrency = convertFromUSD(vacation.priceInCents / 100, currency);
                return {
                    sku         : vacation.sku,
                    name        : vacation.name,
                    description : vacation.description,
                    price       : localCurrency,
                    inSeason    : vacation.inSeason,
                    qty         : vacation.qty
                };
            })
        };

        switch (currency) {
            case 'USD': context.currencyUSD = 'selected'; break;
            case 'GBP': context.currencyGBP = 'selected'; break;
            case 'BTC': context.currencyBTC = 'selected'; break;
        }

        resp.render('vacations', context);
    });
});

app.get('/notify-me-when-in-season', function (req, resp) {
    resp.render('notify-me-when-in-season', { sku: req.query.sku });
});

app.post('/notify-me-when-in-season', function (req, resp) {
    VacationInSeasonListener.update(
        { email:          req.body.email  },
        { $push:  { skus: req.body.sku   }},
        { upsert: true },
        function (err) {
            if (err) {
                console.error(err.stack);
                req.session.flash = {
                    type    : 'danger',
                    intro   : 'Oops!',
                    message : 'There was an error processing your request.'
                };
                return resp.redirect(303, '/vacations');
            }
            req.session.flash = {
                type    : 'success',
                intro   : 'Thank you!',
                message : 'You will be notified when this vacation is in season.'
            };
            return resp.redirect(303, '/vacations');
        }
    );
});

app.get('/set-currency/:currency', function (req, resp) {
    req.session.currency = req.params.currency;
    return resp.redirect(303, '/vacations');
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

// Shopping cart routes.
app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

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

app.get('/fail', function(req, resp) {   // jshint ignore:line
    throw new Error('Nope!');
});

app.get('/epic-fail', function (req, resp) {  // jshint ignore:line
    process.nextTick(function () {
        throw new Error('Kaboom!');
    });
});

// Custom 404 page.
app.use(function (req, resp) {
    resp.status(404);
    resp.render('404');
});

// Custom 500 page.
app.use(function (err, req, resp , next) {  // jshint ignore:line
    console.error(err.stack);
    resp.status('500');
    resp.render('500');
});

/*
var startServer = function () {
    var s = http.createServer(app);
    s.listen(app.get('port', function () {
        console.log('Express started at %s, in %s mode on http://localhost:%d',
            new Date().toISOString(),
            app.get('env'),
            app.get('port'));
    }));
    return s;
};

server = startServer();
*/

server = http.createServer(app);
server.listen(app.get('port'), function () {
    console.log('Express started at %s, in %s mode on http://localhost:%d',
        new Date().toISOString(),
        app.get('env'),
        app.get('port'));
});
