let keyword = {};

module.exports = {
	isLocal: (env) => env === 'local',
	isProduction: (env) => env === 'production',
	isTest: (env) => env === 'test',
	setKeyword: (name) => {
		keyword = name;
	},
	tokenHumanize: (quantity) => {
		if (quantity != 1) {
			return keyword.plural;
		}
		return keyword.singular;
	},
	usersArray: (ids) => ids.slice(0, -1).map((receiver) => '<@'+receiver+'>').join(', ') + 'and ' + '<@'+ids.slice(-1)[0]+'>'
};
