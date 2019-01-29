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
