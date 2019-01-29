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
