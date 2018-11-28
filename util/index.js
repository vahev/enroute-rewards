module.exports = {
	isLocal: (env) => env === 'local',
	isProduction: (env) => env === 'production',
	isTest: (env) => env === 'test'
};
