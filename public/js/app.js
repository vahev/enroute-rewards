const app = angular.module('rewards', []);

if (window.location.hostname === 'rewards.io'){
	const port = '4201';
	var livereload = document.createElement('script');
	livereload.setAttribute('src','http://127.0.0.1:' + port + '/livereload.js');
	document.head.appendChild(livereload);
}

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
