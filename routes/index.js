module.exports = function (app, config){
	app.get('/', (req, res) => {
		// res.send(config.getAll());
		res.render('index', {
			config: config.getAll(),
			message: 'Hello there!',
			title: 'Hey'
		});
	});
};
