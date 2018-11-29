// const logger = require('./../logger')(__dirname);

module.exports = function (app, config){
	app.get('/', async (req, res) => {
		res.render('index', {
			app: {
				title: 'Enroute Rewards'
			},
			config: {
				app: await config.getApp(),
				local: await config.getAll(),
				rewards: await config.getRewards()
			},
			view: {
				title: 'Configuration',
				url: 'configuration'
			}
		});
	});
};
