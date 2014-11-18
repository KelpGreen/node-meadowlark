'use strict';

var fortunes = [
	'Conquer your fears or they will conquer you.',
	'Rivers need springs.',
	'Do not fear what you don\'t know.',
	'You will have a pleasant surprise.',
	'Whenever possible, keep it simple.',
];

exports.getFortune = function () {
	var j = Math.floor(Math.random() * fortunes.length);
	return fortunes[j];
};
