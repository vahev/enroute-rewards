const LEADERBOARD_ENDPOINT = '/leaderboard/';


app.factory('leaderboardService', [
	'$log', '$http', ($log, $http) => ({
			get: (id) => $http.get(`${LEADERBOARD_ENDPOINT}/${id}`),
			getAll: () => $http.get(`${LEADERBOARD_ENDPOINT}all`),
			getValid: () => $http.get(`${LEADERBOARD_ENDPOINT}valid`)
		})
]);
