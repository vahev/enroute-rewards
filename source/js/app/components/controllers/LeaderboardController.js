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
