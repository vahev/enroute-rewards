var firebase = require('firebase'),
		request = require('request'),
		config = require(`${base_path}/config`),
		logger = require('./../logger')(__dirname);

firebase.initializeApp(config.get('firebase'));

const INVALID_USERS = ['test_user', 'undefined'];
const DEFAULT_USER = {
	coins: config.get('defaultCoins'),
	total_coins: 0
};
const USER_LIST = `https://slack.com/api/users.list?token=${config.get('slack').bot.token}&include_locale=true`;

function getUser(user) {
	var ref = firebase.database().ref('users/' + user);
	return new Promise((resolve, reject) => {
		ref.once('value', (snapshot) => {
			if (snapshot.val() === null) {
				ref.set(DEFAULT_USER).then(function (){
					logger.info('User created successfully.');
					resolve(DEFAULT_USER);
				});
			} else {
				resolve(snapshot.val());
			}
		})
		.catch(function (error) {
			reject(error);
		});
	});
}

function setUserTimeOffset(userID, timezone, timezoneOffset) {
	// console.log(`timezoneOffset ======> ${timezoneOffset}`);
	// console.log(`timezone ======> ${timezone}`);
	var ref = firebase.database().ref(`users/${userID}`);
	ref.once("value")
	.then((snapshot) => {
		if (snapshot.child('timeZone').val() === null) {
			firebase.database().ref(`users/${userID}`).child('timezone').update({
				timezone,
				timezoneOffset
			});
		}
	});
}

function getUserTokens(user) {
	return firebase.database().ref('users/' + user + '/coins');
}

function getUserTotalTokens(user) {
	return firebase.database().ref('users/' + user + '/total_coins');
}

function getUsers() {
	return firebase.database().ref('users/').once('value');
}

function getValidUsers() {
	return new Promise(function(resolve, reject) {
		getUsers()
		.then((snapshot) => {
			const users = snapshot.val();
			const result = Object.keys(users)
					.filter((key) => key.length <= 9)
					.filter((key) => INVALID_USERS.indexOf(key) < 0)
					.map((key) => {
						users[key].id = key;
						return users[key];
					})
					.sort((a, b) => (b.total_coins || 0) - (a.total_coins || 0));
			resolve(result);
		})
		.catch((error) => reject(error));
	});
}

function getProfile(member) {
	const result = {};
	const user_keys = ['name','real_name','tz','tz_label','tz_offset'];
	user_keys.forEach((key) => {
		if (typeof member[key] !== 'undefined') {
			result[key] = member[key];
		}
	});
	const profile_keys = ['status_emoji', 'image_original', 'image_512', 'image_1024'];
	profile_keys.forEach((key) => {
		if (typeof member.profile[key] !== 'undefined') {
			result[key] = member.profile[key];
		}
	});
	return result;
}

function updateUsersWithSlack() {
	return new Promise(function(resolve, reject) {
		getValidUsers()
		.then((users) => {
			request(USER_LIST, (error, response, body) => {
				if (error) {
					reject(error);
				} else {
					const { members } = JSON.parse(body);
					users.forEach((user) => {
						const memberFound = members.find((member) => member.id === user.id);
						if (memberFound) {
							firebase.database().ref(`users/${user.id}`).update(getProfile(memberFound));
						}
					});
					resolve(true);
				}
			});
		})
		.catch((error) => reject(error));
	});
}


function sendTokens(giverId, receiversIds, tokenQuantity, eachTransaction) {
	var i = 0;
	return new Promise(function(resolve, reject) {
		receiversIds.forEach(function(receiverId) {
			getUser(receiverId).then(function() {

				getUserTokens(giverId).transaction(function(tokens) {
					return tokens - tokenQuantity;
				});

				getUserTotalTokens(receiverId).transaction(function(tokens) {
					return tokens + tokenQuantity;
				});

				var transactions = firebase.database().ref('transactions'),
				newTransaction = transactions.push();

				newTransaction.set({
					date: firebase.database.ServerValue.TIMESTAMP,
					from: giverId,
					quantity: tokenQuantity,
					to: receiverId,
					type: "tokenGift"
				})
				.then(() => {
					eachTransaction(receiverId);
					i += 1;
					if (i >= receiversIds.length) {
						resolve();
					}
				})
				.catch((error) => reject(error));
			});
		});
	});
}

function reset() {
	return new Promise(function(resolve, reject) {
		firebase.database().ref('users').once('value', function(snapshot) {
			const keys = Object.keys(snapshot.val());
			let i = 0;
			keys.forEach((key) => {
				logger.info(`reset`);
				logger.info(`users/${key}/coins`);
				firebase.database().ref(`users/${key}/coins`)
					.set(config.get('defaultCoins'))
					.catch((error) => reject(error))
					.finally(() => {
						i += 1;
						if (i >= keys.length) {
							resolve(true);
						}
					});
			});
		});
	});
}

module.exports = {
	getUser,
	getUserTokens,
	getUsers,
	getValidUsers,
	reset,
	sendTokens,
	setUserTimeOffset,
	updateUsersWithSlack
};
