var set = function (settings) {
	console.log(settings, '=>', matrix.config.settings);

	Object.keys(settings).forEach(k => {
		if (!matrix.config.settings.hasOwnProperty(k)) {
			return console.error('Cannot add settings which are not registered in the config.yaml', k);
		}
		if (_.isFunction(settings[k]) || _.isPlainObject(settings[k])) {
			return console.error('Settings can only be strings or integers.', settings[k], k);
		}
	});

	// converge
	_.merge(matrix.config.settings, settings);

	process.send({
		type: 'update-setting',
		settings: settings
	});

};

module.exports = set;