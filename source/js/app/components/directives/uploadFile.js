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
