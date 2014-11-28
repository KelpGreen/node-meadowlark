//
// From http://theholmesoffice.com/mongoose-connection-best-practice/
//
'use strict';

var mongoose            = require('mongoose'),          // MongoDB
    mongooseSession     = require('mongoose-session'),
    Vacation            = require('./vacation'),
    connectionString, dbOptions;

module.exports = {};

dbOptions = {
    server: {
        socketOptions: { keepAlive: 1 }
    }
};

// Initialize vacations.
var intializeVacations = function () {

    Vacation.find(function (err, vacations) {
        // If vacations already exist, leave.
        if (vacations.length) {
            return;
        }

        console.log('Initializing Vacation database collection.');

        new Vacation({
            name:           'Hood River Day Trip',
            slug:           'hood-river-day-trip',
            category:       'Day Trip',
            sku:            'HR199',
            description:    'Spend a day sailing on the Columbia and ' +
                            'enjoying craft beers in Hood River!',
            priceInCents:   9995,
            tags:           [
                                'day trip',
                                'hood river',
                                'sailing',
                                'windsurfing',
                                'breweries'
                            ],
            inSeason: true,
            maximumGuests:  16,
            available:      true,
            packagesSold:   0,
        }).save();

        new Vacation({
            name          : 'Oregon Coast Getaway',
            slug          : 'oregon-coast-getaway',
            category      : 'Weekend Getaway',
            sku           : 'OC39',
            description   : 'Enjoy the ocean air and quaint coastal towns!', 
            priceInCents  : 269995,
            tags          : ['weekend getaway', 'oregon coast', 'beachcombing'],
            inSeason      : false,
            maximumGuests : 8,
            available     : true,
            packagesSold  : 0,
        }).save();

        new Vacation({
            name           : 'Rock Climbing in Bend',
            slug           : 'rock-climbing-in-bend',
            category       : 'Adventure',
            sku            : 'B99',
            description    : 'Experience the thrill of climbing in the high desert.',
            priceInCents   : 289995,
            tags           : ['weekend getaway', 'bend', 'high desert', 'rock climbing'],
            inSeason       : true,
            requiresWaiver : true,
            maximumGuests  : 4,
            available      : false,
            packagesSold   : 0,
            notes          : 'The tour guide is currently recovering from a skiing accident.',
        }).save();    
    });
};

var initDb = function (envName, credentials) {

    // Database configuration.
    switch (envName) {
        case 'development':
            connectionString = credentials.mongo.development.connectionString;
            break;

        case 'production':
            connectionString = credentials.mongo.production.connectionString;
            break;

        default:
            throw new Error('Unknown execution environment: %j', envName);
    }

    // This connect() function apparently doesn't happen synchronously.
    // I don't quite understand why.
    mongoose.connect(connectionString, dbOptions);

    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', function () {
      console.log('Mongoose default connection open to %s', connectionString);
    });

    // If the connection throws an error
    mongoose.connection.on('error',function (err) {
      console.log('Mongoose default connection error: ' + err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
      console.log('Mongoose default connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function() {
      mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
      });
    });

    // Session store.
    module.exports.sessionStore = mongooseSession(mongoose);

    intializeVacations();
};

module.exports.init = initDb;
