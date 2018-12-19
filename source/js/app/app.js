/*eslint no-unused-vars: "off"*/
/*eslint no-undef: "off"*/
// build: {build}

firebase.initializeApp({firebase_config});
const app = angular.module('rewards', ['ngSanitize']);
const emoji = new EmojiConvertor();

app.filter("emojis", [
	'$sce', function($sce) {
		return (input) => {
			const emojiReplace = emoji.replace_colons(input);
			if (emojiReplace !== input) {
				return $sce.trustAsHtml(emojiReplace);
			}
			return "";
		};
	}
]);

app.filter("length", function() {
	return function(input) {
		return Object.keys(input || {}).length;
	};
});

app.factory('emojiService', [
	() => ({
		replace_mode: emoji.replace_mode
	})
]);
