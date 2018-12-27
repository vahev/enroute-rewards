global.base_path = `${__dirname}/`;

/*--------
Init
--------*/
var util = require('./util'),
		logger = require('./logger')('index'),
		Botkit = require('botkit'),
		cron	 = require('node-cron'),
		https	 = require('https'),
		http	 = require('http'),
		db		 = require('./db'),
		config = require('./config'),
		controller = Botkit.slackbot({
			clientSigningSecret: config.get('slack').slackbot.clientSecret,
			debug: false
		}),
		express = require('express'),
		session = require('express-session'),
		bodyParser = require('body-parser'),
		cookieParser = require('cookie-parser'),
		MemoryStore = require('session-memory-store')(session),
		uuid = require('uuid'),
		passport = require('passport'),
		SlackStrategy = require('passport-slack-oauth2').Strategy;

/*--------
Params
--------*/
const ENVIRONMENT = config.get('ENVIRONMENT', 'local'),
			PORT  = config.get('PORT', '3000'),
			PING  = config.get('PING', false);

var bot = controller.spawn({token: config.get('slack').bot.token});
const invalidUsers = ['test_user'];

/*--------
Passport
--------*/
passport.use(new SlackStrategy({
	callbackURL: config.getCallbackURL(),
	clientID: config.get('slack').client_id,
	clientSecret: config.get('slack').client_secret
}, (accessToken, refreshToken, profile, done) => {
	done(null, profile);
}));

const users = {};
passport.serializeUser((user, done) => {
	const id = uuid.v4();
	users[id] = user;
	done(null, id);
});

passport.deserializeUser((id, done) => {
	done(null, users[id]);
});

/*--------
Express
--------*/
const app = express();
app.set('port', PORT);
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: '12345QWERTY-SECRET',
	store: new MemoryStore()
}));
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());


/*--------
Routes
--------*/
app.use('/auth', require('./routes/auth'));
app.use('/rewards', require('./routes/rewards'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/', require('./routes/views'));

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
Command list
--------*/
const commandList = [
	{
		message: `Displays the ${singular} leaderboard, it can be used on any channel where the bot is invited.`,
		name: 'show leaderboard'
	},
	{
		message: `Displays the actual quantity of ${plural} you have, this command need to be a direct message to the bot.`,
		name: `my ${plural}`
	}
];

/*--------
Reset Tokens
--------*/

controller.hears(`reset daily ${plural}`, 'direct_message', (bot, message) => {
	if (config.get('admins').includes(message.user)) {
		db.reset()
			.then(() => {
				bot.reply(message, `The ${plural} has been reset.`);
			})
			.catch((error) => {
				bot.reply(error, `Error while reset the ${plural}.`);
			});
	} else {
		bot.reply(message, `You don't have permission to do this command.`);
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
					messageLeft = (user.coins === 0) ? `, don't have *any* ${plural} at all. Tomorrow you will have more ${plural}.` : ', but you only have *' + user.coins + '*.';
					bot.startPrivateConversation({ user: giverId },
						function(response, convo) {
							convo.say(`*You don't have enough ${plural}.* You're trying to send *` + tokensToSend + '* '+util.tokenHumanize(tokens)+messageLeft);
						});
				} else {
					logger.info('tokens');
					logger.info(tokens);
					db.sendTokens(giverId, receiversIds, tokens, function(receiverId) {
							bot.startPrivateConversation({ user: receiverId }, function(response, convo) {
									convo.say(`You received *${tokens}* ${util.tokenHumanize(tokens)} from <@${giverId}>`);
								});
						})
						.then(function() {
							if (receiversIds.length == 1) {
								logger.info('tokensLeft');
								logger.info(tokensLeft);
								messageLeft = (tokensLeft === 0) ? `, that was your last token. Don't worry tomorrow you will have more ${plural}.` : ', now you only have ' + tokensLeft + ' '+util.tokenHumanize(tokensLeft)+' left.';
								bot.startPrivateConversation({ user: giverId }, function(response, convo) {
									convo.say(`You sent *${tokens}* ${util.tokenHumanize(tokens)} to <@${receiversIds[0]}>${messageLeft}`);
								});
							} else {
								messageLeft = (tokensLeft === 0) ? `, those were your last tokens. Don't worry tomorrow you will have more tokens.` : `, now you only have ${tokensLeft} ${util.tokenHumanize(tokensLeft)} left.` + (tokensLeft === 1) ? ' Choose wisely.' : '';
								bot.startPrivateConversation({ user: giverId }, function(response, convo) {
									convo.say(`You sent a total of *${tokensToSend}* tokens to ` + util.usersArray(receiversIds) + messageLeft);
								});
							}
						});
				}
			});
		} else {
			bot.startPrivateConversation({ user: giverId },
				function(response, convo) {
					convo.say(`Very funny, but you can't send ${plural} to yourself.`);
				});
		}
	});
}

if (util.isProduction(ENVIRONMENT)) {
	controller.hears(token, 'direct_message', function(bot, message) {
		bot.reply(message, `You can't sent ${plural} through a direct message`);
	});
}

/*--------
Dashboard Listener
--------*/
if (util.isProduction(ENVIRONMENT) || util.isTest(ENVIRONMENT)) {
	controller.hears('show leaderboard', 'ambient', function(bot, message) {
		let leaderboard = [];
		db.getValidUsers()
		.then(function(users) {
				leaderboard = users.slice(0,10);
				const result = leaderboard
					.map((user, index) => `${index+1}. <@${user.id}> : ${user.total_coins} ${plural}`)
					.join('\n');
				bot.reply(message, `===== Top 10 ===== \n ${result}`);
			});
	});
}

/*--------
Display command list
--------*/
var CommandListAttach = require('./attachments/command_list.js');
controller.hears('help', 'direct_message', (bot, message) => {
	var attach = new CommandListAttach();
	Object.keys(commandList).forEach((index) => {
		// console.log(commandList[index]);
		attach.attachments[0].fields.push({
			"title": commandList[index].name,
			"value": commandList[index].message
		});
	});
	bot.reply(message, attach);
});

/*--------
Personal tokens list
--------*/

if (util.isProduction(ENVIRONMENT) || util.isTest(ENVIRONMENT)) {
	controller.hears(`my ${plural}`, 'direct_message', function(bot, message) {
		db.getUser(message.user)
		.then((user) => {
			bot.reply(message, `You have ${user.total_coins} ${plural}`);
		});
	});
}

function cleanDeletedUsers() {
	request(`https://slack.com/api/users.list?token=${config.get('token')}&include_locale=true&pretty=1`, (error, response, body) => {
		if (error) {
			// Print the error if one occurred
			logger.error(error);
		} else {
			// Print the response status code if a response was received
			logger.info(response);
			JSON.parse(body).members.forEach(function(member) {
				if (member.deleted) {
					db.deleteUser(member.id, member.name);
				}
			});
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

if (util.isProduction(ENVIRONMENT) || util.isTest(ENVIRONMENT)) {
	start_rtm();
} else {
	logger.info(`RTM hasn't started.`);
}

/*--------
Cron
--------*/
cron.schedule('59 23 * * ' + config.get('schedule').days, function() {
	cleanDeletedUsers();
	db.reset();
},{
	scheduled: true,
	timezone: config.get('timezone')
});

/*--------
Ping
--------*/
if (PING && util.isProduction(ENVIRONMENT)) {
	setInterval(() => {
		https.get("https://"+config.get('ping').app_name+".herokuapp.com");
	}, config.get('ping').time);
}
