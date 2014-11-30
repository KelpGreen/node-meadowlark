'use strict';

var pg              = require('pg'),                // PostgreSQL
    connectPg       = require('connect-pg-simple'), // PostgreSQL session store
    expressSession  = require('express-session'),
    connectionString;

module.exports = {};

var initDb = function (envName, credentials) {

    // Database configuration.
    switch (envName) {
        case 'development':
            connectionString = credentials.postgresql.development.connectionString;
            break;

        case 'production':
            connectionString = credentials.postgresql.production.connectionString;
            break;

        default:
            throw new Error('Unknown execution environment: %j', envName);
    }

    // Session store.
    var PgSession = connectPg(expressSession);
    module.exports.sessionStore = new PgSession({
        pg:             pg,
        conString:      connectionString,
        tableName:      'session'
    });
};

module.exports.init = initDb;
