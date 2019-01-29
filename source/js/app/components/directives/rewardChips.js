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
