/*eslint no-unused-vars: "off"*/
/*eslint no-undef: "off"*/
// build: 28/01/2019

firebase.initializeApp({"apiKey":"AIzaSyBebYtKOqOxENgVbTfiNhWAxh4cr_Vn7Ec","authDomain":"rewards-cee1a.firebaseapp.com","databaseURL":"https://rewards-cee1a.firebaseio.com","projectId":"rewards-cee1a","storageBucket":"rewards-cee1a.appspot.com","messagingSenderId":"376174432289"});
const app = angular.module('rewards', ['ngSanitize']);
const emoji = new EmojiConvertor();

app.filter("emojis", [
	'$sce', function($sce) {
		return (input) => {
			const emojiReplace = emoji.replace_colons(input);
			if (emojiReplace !== input) {
				return $sce.trustAsHtml(emojiReplace);
			}
			return "";
		};
	}
]);

app.filter("length", function() {
	return function(input) {
		return Object.keys(input || {}).length;
	};
});

app.factory('emojiService', [
	() => ({
		replace_mode: emoji.replace_mode
	})
]);

if (window.location.hostname === 'rewards.io'){
	const port = '4201';
	var livereload = document.createElement('script');
	livereload.setAttribute('src','http://127.0.0.1:' + port + '/livereload.js');
	document.head.appendChild(livereload);
}

app.controller('LeaderboardController', [
	'$scope', '$log', 'leaderboardService', 'configService', 'emojiService',
	($scope, $log, $leaderboard, $config, $emoji) => {
		const images = ['image_1024', 'image_512', 'image_original'];
		$scope.emoji = $emoji;
		$scope.config = $config;
		$scope.fetchLeaderboard = () => {
			$leaderboard.getValid().then((leaderboard) => {
				$scope.leaderboard = leaderboard.data;
			});
		};


		$scope.hasImage = (user) => Object.keys(user).some((key) => images.indexOf(key) > 0);

		$scope.getImage = (user) => {
			let image = '';
			images.forEach((key) => {
				if (typeof user[key] !== 'undefined') {
					image = user[key];
				}
			});
			return image;
		};

		$scope.fetchLeaderboard();
	}
]);

app.controller('RewardsController', [
	'$scope', '$log', 'rewardsService', 'emojiService',
	($scope, $log, $rewards, $emoji) => {
		$scope.emoji = $emoji;
		$scope.newReward = null;
		$scope.fetchRewards = () => {
			$scope.newReward = null;
			$rewards.getAll().then((rewards) => {
				$scope.newReward = angular.copy($rewards.reward({name: 'New Reward'}));
				Object.keys(rewards.data).forEach((key) => {
					rewards.data[key].id = key;
				});
				$scope.rewards = rewards.data;
			});
		};
		$scope.fetchRewards();
		$scope.redeem = (reward) => $rewards.redeem(reward);
	}
]);

app.directive('rewardCard', () => ({
		controller: [
			'$log', '$scope', '$element', 'rewardsService', 'configService',
			($log, $scope, $element, $rewards, $config) => {
				$scope.config = $config;
				$scope.updating = false;
				$scope.uploading = false;
				$scope.choosing_options = false;
				$scope.reward_options_steps = {};
				$scope.reward_options_selected = [];
				$scope.show_options = false;
				$scope.isAdmin = typeof $element.attr('is-admin') !== 'undefined';

				if (!$scope.reward || $scope.isNew) {
					$scope.reward = $rewards.reward({
						name: 'New Reward'
					});
					$scope.btnMessage = 'New';
				}

				$scope.available = (typeof $scope.reward.stock !== 'undefined') ? $scope.reward.stock > 0 : 0;

				let originalReward = angular.copy($scope.reward);
				if ($scope.reward.image) {
					$rewards.getImageUrl($scope.reward.image)
					.then((response) => {
						$scope.imageURL = response;
						$scope.$apply();
					})
					.catch(() => {
						$scope.imageURL = null;
						$scope.$apply();
					})
					.finally(() => {
						$scope.imageLoaded = true;
						$scope.$apply();
					});
				}
				$scope.save = () => {
					$scope.updating = true;
					$scope.uploading = true;
					let { key } = $scope;
					if ($scope.isNew) {
						key = null;
					}
					$rewards.update(key, $scope.reward, $scope.changedProperties())
						.then(() => {
							originalReward = angular.copy($scope.reward);
						})
						.finally(() => {
							if ($scope.isNew && typeof $scope.onNew === 'function') {
								$scope.onNew();
							}
							$scope.uploading = false;
							$scope.updating = false;
							$scope.cancel();
							$scope.$apply();
						});
				};

				$scope.edit = () => {
					$scope.updating = true;
				};

				$scope.cancel = () => {
					$scope.reward = angular.copy(originalReward);
					$scope.updating = false;
				};

				$scope.remove = () => {
					$rewards.remove($scope.key)
						.then(() => {
							if (typeof $scope.onRemove === 'function') {
								$scope.onRemove();
							}
						});
				};

				// $log.log(Object.keys(originalReward));

				const rewardsProperties = ['detail', 'image', 'name', 'price', 'unique', 'stock', 'options'];

				$scope.changedProperties = () => rewardsProperties
					.filter((key) => typeof rewardsProperties[key] === 'undefined' && typeof $scope.reward[key] !== 'undefined')
					.filter((key) => originalReward[key] !== $scope.reward[key])
					.filter((key) => {
						if (typeof $scope.reward[key] === 'object') {
							if (typeof originalReward[key] === 'undefined' && typeof $scope.reward[key] === 'undefined') {
								return false;
							}
							return JSON.stringify(originalReward[key]) !== JSON.stringify($scope.reward[key]);
						}
						return true;
					});

				$scope.hasChanged = () => $scope.changedProperties().length > 0;
				// $scope.hasChanged = () => {
				// 	if ($scope.changedProperties().length > 0) {
				// 		console.log($scope.changedProperties());
				// 		$scope.changedProperties().forEach((key) => {
				// 			console.log(originalReward[key], $scope.reward[key]);
				// 		});
				// 	}
				// 	return $scope.changedProperties().length > 0;
				// };

				$scope.$watch(() => $scope.reward.image, (newValue, oldValue) => {
					if ((typeof newValue !== 'undefined' && newValue !== null) && (typeof oldValue === 'undefined' || oldValue === null)) {
						$scope.edit();
					}
					if ((typeof newValue === 'undefined' || newValue === null) && (typeof oldValue !== 'undefined' && oldValue !== null)) {
						$scope.cancel();
					}
				});

				$scope.showOptions = () => {
					let result = {};
					Object.values($scope.reward.options).forEach((option) => {
						if (option.match(/^(\d+):([\s\S]+)/g)) {
							var c = (/^(\d+):([\s\S]+)$/g).exec(option);
							if (typeof result[c[1]] === 'undefined') {
								result[c[1]] = [];
							}
							result[c[1]].push(c[2]);
						} else {
							if (!Array.isArray(result)) {
								result = [];
							}
							result.push(option);
						}
					});
					if (!Array.isArray(result)) {
						$scope.reward_options_steps = Object.values(result);
					} else {
						$scope.reward_options_steps = [result];
					}
					$scope.reward_options_selected = [];
					$scope.show_options = true;
				};

				// $scope.optionsSelected = () => {
				// 	console.log($scope.reward_options_selected.length >= $scope.reward_options_steps.length);
				// 	return $scope.reward_options_selected.length >= $scope.reward_options_steps.length;
				// };

				$scope.optionsSelected = () => {
					if ($scope.reward_options_selected.length >= $scope.reward_options_steps.length) {
						$scope.choosing_options = false;
					}
					return $scope.reward_options_selected.length >= $scope.reward_options_steps.length;
				};

				$scope.redeem = () => {
					if ($scope.reward.options) {
						if (!$scope.choosing_options) {
							$scope.choosing_options = true;
							$scope.showOptions();
						} else if ($scope.optionsSelected()) {
							$scope.choosing_options = false;
							$scope.reward.options = $scope.reward_options_selected;
							$scope.redeemReward();
						}
					} else {
						$scope.redeemReward();
					}
				};

				$scope.redeemReward = () => {
					$scope.updating = true;
					$rewards.redeem($scope.reward)
						.finally(() => {
							$scope.cancel();
						});
				};

				// $log.log($scope.reward);
			}
		],
		restrict: 'E',
		scope: {
			'isNew': '=?',
			'key': '=?',
			'onNew': '&?',
			'onRemove': '&?',
			'reward': '=?'
		},
		templateUrl: '/templates/rewardCard.html'
	})
);

app.directive('rewardChips', () => ({
		controller: [
			'$log', '$scope', '$element', 'configService',
			($log, $scope, $element, $config) => {
				$scope.config = $config;
				$scope.unique = (typeof $scope.unique != 'undefined') ? $scope.unique : true;
				const keysSeparators = ['Tab', 'Enter', ','];
				const input = $element.find('input');
				$scope.chips = (typeof $scope.ngModel != 'undefined') ? Object.values($scope.ngModel) : [];

				$scope.addChip = () => {
					$scope.chips.push($scope.selectedChip);
					$scope.setValue();
					$scope.selectedChip = "";
				};

				$scope.setValue = () => {
					const result = {};
					$scope.chips.forEach((chip, i) => {
						result[i] = chip;
					});
					$scope.ngModel = result;
				};

				$scope.textAreaClick = () => {
					input[0].focus();
				};

				$scope.deleteChip = (chip, $event) => {
					$event.preventDefault();
					$event.stopPropagation();
					$scope.chips.splice($scope.chips.indexOf(chip), 1);
					$scope.setValue();
				};

				$scope.keydown = ($event) => {
					if (keysSeparators.indexOf($event.key) >= 0 && $scope.selectedChip.length) {
						if ($scope.unique && $scope.chips.indexOf($scope.selectedChip) >= 0) {
							return;
						}
						$event.preventDefault();
						$event.stopPropagation();
						$scope.addChip();
					}
				};

			}
		],
		restrict: 'E',
		scope: {
			'ngModel': '=',
			'unique': '@'
		},
		templateUrl: '/templates/rewardChips.html'
	})
);

app.directive('rewardOptions', () => ({
		controller: [
			'$log', '$scope', '$element', 'configService',
			($log, $scope, $element, $config) => {
				$scope.config = $config;

				$scope.selectOption = ($event, option) => {
					const optionSelected = angular.element($event.target);
					angular.element(optionSelected).parent().find('span').removeClass('active');
					angular.element(optionSelected).addClass('active');
					$scope.ngModel = option;
				};
			}
		],
		restrict: 'E',
		scope: {
			'ngModel': '=',
			'options': '&'
		},
		templateUrl: '/templates/rewardOptions.html'
	})
);

app.directive('storageImage', () => ({
		controller: [
			'$log', '$scope', '$element', 'rewardsService',
			($log, $scope, $element, $rewards) => {
				$scope.loaded = false;
				$scope.src = $scope.url;
				$scope.load = () => {
					$rewards.getImageUrl($scope.url)
					.then((response) => {
						$scope.image_url = response;
						$scope.$apply();
					})
					.catch(() => {
						$scope.image_url = null;
						$scope.$apply();
					})
					.finally(() => {
						$scope.loaded = true;
						$scope.$apply();
					});
				};

				$scope.$watch(() => $scope.url, (newValue) => {
					if (newValue && typeof newValue === 'string') {
						$scope.load();
					}
					// $log.log(newValue);
				});
				$scope.load();
			}
		],
		restrict: 'E',
		scope: {
			'url': '='
		},
		templateUrl: '/templates/storageImage.html'
	})
);

app.directive('uploadFile', () => ({
		controller: [
			'$log', '$scope', '$element', 'rewardsService',
			($log, $scope, $element) => {
				$scope.previewUrl = null;
				$scope.previewName = null;
				$scope.preview = false;
				const originalUrl = angular.copy($scope.url);


				$scope.setImage = (result) => {
					$scope.previewUrl = result;
					$scope.preview = true;
					$scope.$apply();
				};

				$scope.cancel = () => {
					$scope.previewUrl = null;
					$scope.previewName = null;
					$scope.preview = false;
					if (typeof originalUrl !== 'undefined') {
						$scope.url = originalUrl;
					} else {
						$scope.url = null;
					}
					angular.element($element.find('input')).val("");
				};

				$scope.processFile = (event) => {
					if (event.files.length != 1) {
						return;
					}
					var reader = new FileReader();
					reader.onload = function(e) {
						$scope.setImage(e.target.result);
					};
					const [file] = event.files;
					reader.readAsDataURL(file);
					$scope.previewName = file.name;
					$scope.url = file;
					$scope.$apply();
				};

				$scope.$watch('url', (newValue) => {
					if (typeof newValue === 'undefined' || newValue === null) {
						$scope.cancel();
					}
				});

			}
		],
		restrict: 'E',
		scope: {
			'url': '='
		},
		templateUrl: '/templates/uploadFile.html'
	})
);

/*eslint no-undef: "off"*/
app.factory('configService', [() => ({"title":"Enroute Rewards","keyword":{"token":":taco:","singular":"taco","plural":"tacos"}})]);

const LEADERBOARD_ENDPOINT = '/leaderboard/';


app.factory('leaderboardService', [
	'$log', '$http', ($log, $http) => ({
			get: (id) => $http.get(`${LEADERBOARD_ENDPOINT}/${id}`),
			getAll: () => $http.get(`${LEADERBOARD_ENDPOINT}all`),
			getValid: () => $http.get(`${LEADERBOARD_ENDPOINT}valid`)
		})
]);

const REWARDS_ENDPOINT = '/rewards';

app.factory('rewardsService', [
	'$log', '$http', ($log, $http) => ({
			get: (id) => $http.get(`${REWARDS_ENDPOINT}/${id}`),
			getAll: () => $http.get(`${REWARDS_ENDPOINT}/all`),
			getImageUrl: (url) => firebase.storage().ref().child(url).getDownloadURL(),
			redeem: (reward) => $http.post(`${REWARDS_ENDPOINT}/redeem`, reward),
			remove: (key) => $http.delete(`${REWARDS_ENDPOINT}/delete/${key}`),
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
								resolve($http.post(`${REWARDS_ENDPOINT}/update`, reward));
							})
							.catch((err) => {
								reject(err);
							});
					});
				}
				return $http.post(`${REWARDS_ENDPOINT}/update`, reward);
			}
		})
]);
