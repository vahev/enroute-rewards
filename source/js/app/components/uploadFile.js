app.directive('uploadFile', () => ({
		controller: [
			'$scope',
			($scope) => {
				$scope.message = 'hello';
			}
		],
		restrict: 'A',
		scope: {},
		templateUrl: 'my-pane.html'
	})
);
