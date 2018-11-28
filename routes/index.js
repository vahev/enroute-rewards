module.exports = function (app, config){
	app.get('/', (req, res) => {
		// res.send(config.getAll());
		res.render('index', {
			app: {
				title: 'Enroute Rewards'
			},
			config: config.getAll(),
			view: {
				title: 'Configuration',
				url: 'configuration'
			}
		});
	});
};
