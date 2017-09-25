var set = function (config.key, config.data) {
	
	console.log('Setting: '.blue, config);

	process.send({
		type: 'update-setting',
		key: config.key,
		data: config.data
	});
};

module.exports = set;