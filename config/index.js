/*eslint no-sync: "off"*/

const fs = require('fs'),
			firebase = require('firebase'),
			logger = require('./../logger')(__dirname),
			configFilePath = './config/config.json';

var config = {},
		configLoaded = false;

function initConfig() {
	if (configLoaded) {
		return;
	}
	if (fs.existsSync(configFilePath)) {
		logger.info(`configuration loaded from ${configFilePath} file`);
		config = JSON.parse(fs.readFileSync(configFilePath));
		configLoaded = true;
	} else if (typeof process.env.REWARDS_CONFIG !== 'undefined') {
		config = JSON.parse(process.env.REWARDS_CONFIG);
		logger.info('config loaded from ENV');
	} else {
		logger.error(`there is no ${configFilePath} file or REWARDS_CONFIG env var.`);
	}
	// logger.info(JSON.stringify(config.firebase));
	// firebase.initializeApp(config.firebase);
}

initConfig();

function get(name, defaultValue){
	if (typeof process.env[name] !== 'undefined') {
		logger.info(`process.env.${name} found`);
		return process.env[name];
	}
	if (typeof config[name] !== 'undefined') {
		return config[name];
	}
	if (typeof defaultValue !== 'undefined') {
		return defaultValue;
	}
	logger.error(`[${name}] does not exists`);
	return null;
}

module.exports = {
	get,
	getAll: () => config,
	getApp: async () => {
		const configApp = await firebase.database().ref('config').once('value');
		return configApp;
	},
	getCallbackURL: () => [get('https'), get('host') ,get('slack').redirect_uri].join(''),
	getRewards: () => {
		const configRewards = firebase.database().ref('rewards').once('value');
		return configRewards;
	},
	isAdmin: (payload) => get('admins').indexOf(payload.user.id) >= 0,
	set: (name, value) => firebase.database().ref('config/' + name).set(value)
};
