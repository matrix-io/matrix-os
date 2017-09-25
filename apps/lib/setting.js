var set = function (key, data) {
	var config = { key: data }
	console.log('Setting: '.blue, config);

	process.send({
		type: 'update-setting',
		config: config
	});
};

module.exports = set;