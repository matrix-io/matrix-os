var set = function (key, data) {
	
	console.log('Setting: '.blue + key + ': ' + data);

	process.send({
		type: 'update-setting',
		key: key,
		data: data
	});
};

module.exports = set;