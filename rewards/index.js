/*eslint no-sync: "off"*/

const firebase = require('firebase');
			// logger = require('./../logger')(__dirname);

module.exports = {
	deleteReward: (id) => firebase.database().ref(`rewards/${id}`).set(null),
	updateReward: (reward) => {
		const valueKeys = ['detail', 'image', 'name', 'price'];
		const valueUpdate = {};
		valueKeys.forEach((key) => {
			if (reward[key]) {
				valueUpdate[key] = reward[key];
			}
		});
		if (reward.key === null) {
			const newReward = firebase.database().ref('rewards');
			const newRewardRef = newReward.push();
			return newRewardRef.set(valueUpdate);
		}
		return firebase.database().ref(`rewards/${reward.key}`).update(valueUpdate);
	}
};
