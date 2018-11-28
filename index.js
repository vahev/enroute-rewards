/*--------------------------------------------------------------
Init
--------------------------------------------------------------*/
var util = require('./util'),
		logger = require('./logger'),
		Botkit = require('botkit'),
		cron	 = require('node-cron'),
		https	 = require('https'),
		http	 = require('http'),
		db		 = require('./firebase_db'),
		config = require('./config'),
		controller = Botkit.slackbot({debug: false}),
		express = require('express');

/*--------------------------------------------------------------
Params
--------------------------------------------------------------*/
const ENVIRONMENT = config.get('ENVIRONMENT', 'local'),
			PORT = config.get('PORT', '3000'),
			PING = config.get('PING', false);

var bot = controller.spawn({token: config.get('slack').bot.token});

/*--------------------------------------------------------------
Express
--------------------------------------------------------------*/
const app = express();
app.set('port', PORT);
app.set('view engine', 'pug');


/*--------------------------------------------------------------
Routes
--------------------------------------------------------------*/
require('./routes')(app, config);

var server = http.createServer(app);
server.listen(PORT);

server.on('error', (error) => {
	logger.log(error);
});

server.on('listening', () => {
	logger.info('Server started.');
});

/*--------------------------------------------------------------
Token
--------------------------------------------------------------*/
const token = config.get('bot_params').keyword,
			regex_token = new RegExp(token, "g"),
			regex_mention = /<@(\S+)>/g;

/*--------------------------------------------------------------
Cron
--------------------------------------------------------------*/
cron.schedule('59 23 * * ' + config.get('schedule').days, function() {
	db.resetCoins();
});

function tokenPlural(quantity) {
	return 'token' + ((quantity != 1) ? 's' : '');
}

function usersArray(ids) {
	return ids.slice(0, -1).map(function(receiverId) {
		return '<@'+receiverId+'>';
	}).join(', ') + 'and ' + '<@'+ids.slice(-1)[0]+'>';
}

/*--------------------------------------------------------------
Token Listener
--------------------------------------------------------------*/
if (util.isProduction(ENVIRONMENT)) {
	controller.hears(token, 'ambient', function(bot, message) {
		var mentioned_users = message.text.match(regex_mention);
		if (mentioned_users.length <= 0) {
			// console.log('There are no users mentioned.');
			return;
		}

		var tokens = message.text.match(regex_token).length;
		if (tokens <= 0) {
			// console.log('There are no tokens in the message.');
			return;
		}

		mentioned_users = mentioned_users.map(function(mention_user) {
			return mention_user.trim().replace(/<|@|>/g, '');
		});

		var giverId = message.user,
				receiversIds = mentioned_users,
				tokensToSend = (tokens * receiversIds.length),
				messageLeft = '';

		if (receiversIds.indexOf(giverId) < 0) {
			db.getUser(giverId).then(function(user) {
				var tokensLeft = (user.coins - tokensToSend);
				if (tokensLeft < 0) {
					messageLeft = (user.coins === 0) ? ', don\'t have *any* tokens at all. Tomorrow you will have more tokens.' : ', but you only have *' + user.coins + '*.';
					bot.startPrivateConversation({ user: giverId },
						function(response, convo) {
							convo.say('*You don\'t have enough tokens.* You\'re trying to send *' + tokensToSend + '* '+tokenPlural(tokens)+messageLeft);
						});
				} else {
					db.sendTokens(giverId, receiversIds, tokens, function(receiverId) {
							bot.startPrivateConversation({ user: receiverId }, function(response, convo) {
									convo.say('You received *'+tokens+'* '+tokenPlural(tokens)+' from <@' + giverId + '>');
								});
						})
						.then(function() {
							if (receiversIds.length == 1) {
								messageLeft = (tokensLeft === 0) ? ', that was your last token. Don\'t worry tomorrow you will have more tokens.' : ', now you only have ' + tokensLeft + ' '+tokenPlural(tokensLeft)+' left.';
								bot.startPrivateConversation({ user: giverId }, function(response, convo) {
									convo.say('You sent *'+tokens+'* '+tokenPlural(tokens)+' to <@'+receiversIds[0]+'>'+messageLeft);
								});
							} else {
								messageLeft = (tokensLeft === 0) ? ', those were your last tokens. Don\'t worry tomorrow you will have more tokens.' : ', now you only have ' + tokensLeft + ' '+tokenPlural(tokensLeft)+' left.' + (tokensLeft === 1) ? ' Choose wisely.' : '';
								bot.startPrivateConversation({ user: giverId }, function(response, convo) {
									convo.say('You sent a total of *' + tokensToSend + '* tokens to ' + usersArray(receiversIds)+messageLeft);
								});
							}
						});
				}
			});
		} else {
			bot.startPrivateConversation({ user: giverId },
				function(response, convo) {
					convo.say('Very funny, but you can\'t send tokens to yourself.');
				});
		}
	});
}

/*--------------------------------------------------------------
Dashboard Listener
--------------------------------------------------------------*/
if (util.isProduction(ENVIRONMENT) || util.isTest(ENVIRONMENT)) {
	controller.hears('show leaderboard', 'ambient', function(bot, message) {
		var users = [], leaderboard = [], lmessage = '';

		db.getUsers()
			.then(function(snapshot) {
				users = Object.keys(snapshot.val());

				for (var user in users) {
					var tokens = snapshot.child(users[user]).child('total_coins').val();
					if (tokens > 0) {
						leaderboard.push([users[user], tokens]);
					}
				}

				leaderboard.sort(function(a, b) {
					return b[1] - a[1];
				});

				// Modify to get only 5 when going live
				// for (i=0; i<5; i++) {
				for (var i = 0; i < leaderboard.length; i++) {
					lmessage = lmessage.concat('<@' + leaderboard[i][0] + '> : ' + leaderboard[i][1] + ' coins \n');
				}
				bot.reply(message, '=====Leaderboard===== \n ' + lmessage);
			});
	});
}

/*--------------------------------------------------------------
Log every message received
--------------------------------------------------------------*/
// var excludeEvents = ['user_typing','bot_added','user_change','reaction_added','file_shared','file_public','dnd_updated_user','self_message','emoji_changed'];
// controller.middleware.receive.use(function(bot, message, next) {
// 	if (excludeEvents.indexOf(message.type) < 0) {
// 		// console.log('RECEIVED: ', message);
// 	}
// 	message.logged = true;
// 	next();
// });

/*--------------------------------------------------------------
Log every message sent
--------------------------------------------------------------*/
// controller.middleware.send.use(function(bot, message, next) {
// 	// console.log('SENT: ', message);
// 	message.logged = true;
// 	next();
// });

/*--------------------------------------------------------------
Bot starts
--------------------------------------------------------------*/
function start_rtm() {
	bot.startRTM(function(err) {
		if (err) {
			console.error('Failed to start RTM', err);
			return setTimeout(start_rtm, 60000);
		}
		logger.info("RTM started!");
	});
}

controller.on('rtm_close', function(bot, err) {
	console.error('rtm_close event', bot, err);
	start_rtm();
});

if (util.isProduction(ENVIRONMENT)) {
	start_rtm();
}

/*--------------------------------------------------------------
Ping
--------------------------------------------------------------*/
if (PING && util.isProduction(ENVIRONMENT)) {
	setInterval(() => {
		https.get("https://"+config.get('ping').app_name+".herokuapp.com");
	}, config.get('ping').time);
}
