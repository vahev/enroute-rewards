app.directive('rewardCard', () => ({
		controller: [
			'$log', '$scope', '$element', 'rewardsService', 'configService',
			($log, $scope, $element, $rewards, $config) => {
				$scope.config = $config;
				$scope.updating = false;
				$scope.uploading = false;
				$scope.isAdmin = typeof $element.attr('is-admin') !== 'undefined';

				if (!$scope.reward || $scope.isNew) {
					$scope.reward = $rewards.reward({
						name: 'New Reward'
					});
					$scope.btnMessage = 'New';
				}

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

				const rewardsProperties = ['detail', 'image', 'name', 'price'];

				$scope.changedProperties = () => rewardsProperties
						.filter((key) => typeof rewardsProperties[key] === 'undefined' && typeof $scope.reward[key] !== 'undefined')
						.filter((key) => originalReward[key] !== $scope.reward[key])
						.filter((key) => {
							// if (typeof $scope.reward[key] === 'string') {
							// 	return $scope.reward[key].trim().length > 0;
							// }
							if (typeof $scope.reward[key] === 'object') {
								return $scope.reward[key] !== null;
							}
							return true;
						});

				$scope.hasChanged = () => $scope.changedProperties().length > 0;

				$scope.$watch(() => $scope.reward.image, (newValue, oldValue) => {
					if ((typeof newValue !== 'undefined' && newValue !== null) && (typeof oldValue === 'undefined' || oldValue === null)) {
						$scope.edit();
					}
					if ((typeof newValue === 'undefined' || newValue === null) && (typeof oldValue !== 'undefined' && oldValue !== null)) {
						$scope.cancel();
					}
				});

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
