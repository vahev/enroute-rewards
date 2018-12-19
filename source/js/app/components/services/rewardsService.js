const ENDPOINT = '/rewards/';


app.factory('rewardsService', [
	'$log', '$http', ($log, $http) => ({
			get: (id) => $http.get(`${ENDPOINT}/${id}`),
			getAll: () => $http.get(`${ENDPOINT}all`),
			getImageUrl: (url) => firebase.storage().ref().child(url).getDownloadURL(),
			remove: (key) => $http.delete(`${ENDPOINT}delete/${key}`),
			reward: (args) => {
				function Reward(args){
					Object.assign(this, args);
				}
				return new Reward(args);
			},
			update: (key, reward, changes) => {
				$log.log('changes', changes);
				const storage = firebase.storage();
				reward.key = key;
				if (changes.indexOf('image') > -1) {
					const date = Number(new Date());
					const fileName = `images/rewards/${date}-${reward.image.name}`;
					const ref = storage.ref().child(fileName);
					return new Promise(function(resolve, reject) {
						ref.put(reward.image)
							.then(() => {
								reward.image = fileName;
								resolve($http.post(`${ENDPOINT}update`, reward));
							})
							.catch((err) => {
								reject(err);
							});
					});
				}
				return $http.post(`${ENDPOINT}update`, reward);
			}
		})
]);
