'use strict';

var mongoose = require('mongoose'),
    vacationInSeasonListenerSchema,
    VacationInSeasonListener;

vacationInSeasonListenerSchema = mongoose.Schema({
    email: String,
    skus:  [String]
});

VacationInSeasonListener = mongoose.model(
    'VacationInSeasonListener',
    vacationInSeasonListenerSchema);

module.exports = VacationInSeasonListener;
