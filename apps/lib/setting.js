var set = function (config) {
	console.log('Setting: ', config);

	process.send({
		type: 'update-setting',
		config: config
	});
};

module.exports = set;