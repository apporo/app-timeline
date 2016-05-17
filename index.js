module.exports = require('devebot').registerLayerware(__dirname, [
	'app-databoard',
	'app-filestore',
	'app-localization',
	'app-webfonts',
	'app-webserver'
], [
	'devebot-co-mongoose'
]);
