app.controller('RewardsController', [
	'$scope', '$log', 'rewardsService',
	($scope, $log, $rewards) => {
		$scope.fetchRewards = () => {
			$scope.newReward = null;
			$rewards.getAll().then((rewards) => {
				$scope.newReward = angular.copy($rewards.reward({name: 'New Reward'}));
				$scope.rewards = rewards.data;
			});
		};

		$scope.fetchRewards();
	}
]);
