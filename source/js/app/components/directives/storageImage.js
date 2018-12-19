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
