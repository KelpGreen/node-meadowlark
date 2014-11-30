'use strict';

// I should put this file in .gitignore, but I don't want to spend time now
// researching how to get this to work with Heroku, which uses Git to deploy.
module.exports = {
    cookieSecret: 'lungs every it brief',

    mongo: {
        development: {
            connectionString: 'mongodb://localhost:27017/meadowlark-dev'
        },
        production: {
            connectionString: 'mongodb://localhost:27017/meadowlark-prod'
        }
    },

    postgres: {
        development: {
            nodepgPassword:     'Guide-Basil-Adapter-72',
            connectionString:   'tcp://nodepg:Guide-Basil-Adapter-72@localhost/meadowlark'
        },
        production: {

        }
    }
};
