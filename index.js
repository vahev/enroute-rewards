/*--------
Init
--------*/
var util       = require('./util'),
	logger     = require('./logger')('index'),
	Botkit     = require('botkit'),
	cron	   = require('node-cron'),
	https	   = require('https'),
	http	   = require('http'),
	request    = require('request'),
	db		   = require('./firebase_db'),
	config     = require('./config'),
	controller = Botkit.slackbot({debug: false}),
	express    = require('express');

/*--------
Params
--------*/
const ENVIRONMENT = config.get('ENVIRONMENT', 'local'),
			PORT  = config.get('PORT', '3000'),
			PING  = config.get('PING', false);

var bot = controller.spawn({token: config.get('slack').bot.token});


/*--------
Express
--------*/
const app = express();
app.set('port', PORT);
app.set('view engine', 'pug');
app.use(express.static('public'));

/*--------
Routes
--------*/
require('./routes')(app, config);

var server = http.createServer(app);
server.listen(PORT);

server.on('error', (error) => {
	logger.log(error);
});

server.on('listening', () => {
	logger.info('Server started.');
});

/*--------
Token
--------*/
const { token, singular, plural } = config.get('keyword'),
			regex_token = new RegExp(token, "g"),
			regex_mention = /<@(\S+)>/g;
util.setKeyword(config.get('keyword'));

/*--------
Invalid Users
--------*/
const invalidUsers = [
	'test_user',
	'USLACKBOT'
];


/*--------
Command list
--------*/
const commandList = [
	{
		message: `Displays the ${singular} leaderboard, it can be used on any channel where the bot is invited.`,
		name: 'Show Leaderboard'
	},
	{
		message: `Displays the actual quantity of ${plural} you have, this command need to be a direct message to the bot.`,
		name: `my ${plural} quantity`
	}
];

/*--------
Cron
--------*/
cron.schedule('59 23 * * ' + config.get('schedule').days, function() {
	db.resetCoins();
});

/*--------
Reset Tokens
--------*/

controller.hears(`Reset daily ${plural}`, 'direct_message', function(bot, message) {
	if (config.admins.includes(message.user)) {
		db.resetCoins();
		bot.reply(message, `The ${plural} has been reset.`);
	} else {
		bot.reply(message, "You don't have permission to do this command.");
	}
});

/*--------
Token Listener
--------*/
if (util.isProduction(ENVIRONMENT)) {
	controller.hears(token, 'ambient', function(bot, message) {
		var mentioned_users = message.text.match(regex_mention);
		if (mentioned_users.length <= 0) {
			return logger.warn('There are no users mentioned.');
		}

		var tokens = message.text.match(regex_token).length;
		if (tokens <= 0) {
			return logger.warn(`There are no ${plural} in the message.`);
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
					messageLeft = (user.coins === 0) ? `, don\'t have *any* ${plural} at all. Tomorrow you will have more ${plural}.` : ', but you only have *' + user.coins + '*.';
					bot.startPrivateConversation({ user: giverId },
						function(response, convo) {
							convo.say(`*You don\'t have enough ${plural}.* You\'re trying to send *` + tokensToSend + '* '+util.tokenHumanize(tokens)+messageLeft);
						});
				} else {
					db.sendTokens(giverId, receiversIds, tokens, function(receiverId) {
							bot.startPrivateConversation({ user: receiverId }, function(response, convo) {
									convo.say('You received *'+tokens+'* '+util.tokenHumanize(tokens)+' from <@' + giverId + '>');
								});
						})
						.then(function() {
							if (receiversIds.length == 1) {
								messageLeft = (tokensLeft === 0) ? `, that was your last token. Don\'t worry tomorrow you will have more ${plural}.` : ', now you only have ' + tokensLeft + ' '+util.tokenHumanize(tokensLeft)+' left.';
								bot.startPrivateConversation({ user: giverId }, function(response, convo) {
									convo.say('You sent *'+tokens+'* '+util.tokenHumanize(tokens)+' to <@'+receiversIds[0]+'>'+messageLeft);
								});
							} else {
								messageLeft = (tokensLeft === 0) ? ', those were your last tokens. Don\'t worry tomorrow you will have more tokens.' : ', now you only have ' + tokensLeft + ' '+util.tokenHumanize(tokensLeft)+' left.' + (tokensLeft === 1) ? ' Choose wisely.' : '';
								bot.startPrivateConversation({ user: giverId }, function(response, convo) {
									convo.say('You sent a total of *' + tokensToSend + '* tokens to ' + util.usersArray(receiversIds)+messageLeft);
								});
							}
						});
				}
			});
		} else {
			bot.startPrivateConversation({ user: giverId },
				function(response, convo) {
					convo.say(`Very funny, but you can\'t send ${plural} to yourself.`);
				});
		}
	});
}

/*--------
Dashboard Listener
--------*/
if (util.isProduction(ENVIRONMENT) || util.isTest(ENVIRONMENT)) {
	controller.hears('show leaderboard', 'ambient', function(bot, message) {
		var users = [], leaderboard = [], lmessage = '';


		db.getUsers()
		.then(function(snapshot) {
			users = Object.keys(snapshot.val());
			for (const user in users) {
				if (!invalidUsers.includes(users[user])) {
					var tokens = snapshot.child(users[user]).child('total_coins').val();
					if (tokens > 0) {
						leaderboard.push([users[user], tokens]);
					}
				}
			}
				leaderboard.sort(function(a, b) {
					return b[1] - a[1];
				});

				// Modify to get only 5 when going live
				// for (i=0; i<5; i++) {
				for (var i = 0; i < 10; i++) {
					lmessage = lmessage.concat(`${i+1}. <@${leaderboard[i][0]}> : ${leaderboard[i][1]} ${plural} \n`);
				}
				bot.reply(message, '=====Top 10===== \n ' + lmessage);
			});
	});
}

/*--------
Display command list
--------*/
var CommandListAttach = require('./attachments/command_list.js');
controller.hears('help',	'direct_message', function(bot, message) {
	var attach = new CommandListAttach();
	Object.keys(commandList[0]).forEach((key) => {
		attach.attachments[0].fields.push({
			"title": key,
			"value": commandList[0][key]
		});
	});
	bot.reply(message, attach);
});

/*--------
Log every message received
--------*/
// var excludeEvents = ['user_typing','bot_added','user_change','reaction_added','file_shared','file_public','dnd_updated_user','self_message','emoji_changed'];
// controller.middleware.receive.use(function(bot, message, next) {
// 	if (excludeEvents.indexOf(message.type) < 0) {
// 		// console.log('RECEIVED: ', message);
// 	}
// 	message.logged = true;
// 	next();
// });

/*--------
Log every message sent
--------*/
// controller.middleware.send.use(function(bot, message, next) {
// 	// console.log('SENT: ', message);
// 	message.logged = true;
// 	next();
// });

/*--------
Personal tokens list
--------*/
controller.hears(`my ${plural} quantity`, 'direct_message', function(bot, message) {
	db.getUsers(message.user).then(function(snapshot){
		var coins = snapshot.child(message.user).child('total_coins').val();
		bot.reply(message, `You have ${coins} ${plural}`);
	});
});


function userTimeOffset(user) {
	request(`https://slack.com/api/users.info?token=${config.get('token')}&user=${user}&locale=true`, function (error, response, body) {
		if (error) {
			console.log('error:', error); // Print the error if one occurred
		}
		else {
			console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
			var data = JSON.parse(body).user
			db.setUserTimeOffset(user, data['tz'], data['tz_offset']);
		}
	});
}

/*--------
Bot starts
--------*/
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

/*--------
Ping
--------*/
if (PING && util.isProduction(ENVIRONMENT)) {
	setInterval(() => {
		https.get("https://"+config.get('ping').app_name+".herokuapp.com");
	}, config.get('ping').time);
}
