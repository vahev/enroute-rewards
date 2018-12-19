/*eslint no-unused-vars: "off"*/
/*eslint no-undef: "off"*/
// build: {build}

firebase.initializeApp({firebase_config});
const app = angular.module('rewards', []);

const emoji = new EmojiConvertor();

app.filter("emojis", function() {
	return function(input) {
		return emoji.replace_colons(input);
	};
});

app.filter("length", function() {
	return function(input) {
		return Object.keys(input || {}).length;
	};
});
