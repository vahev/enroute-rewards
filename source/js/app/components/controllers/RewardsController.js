app.controller('RewardsController', [
	'$scope', '$log', 'rewardsService', 'emojiService',
	($scope, $log, $rewards, $emoji) => {
		$scope.emoji = $emoji;
		$scope.fetchRewards = () => {
			$rewards.getAll().then((rewards) => {
				$scope.rewards = rewards.data;
			});
		};
		$scope.fetchRewards();
		$scope.redeem = (reward) => $rewards.redeem(reward);
	}
]);
