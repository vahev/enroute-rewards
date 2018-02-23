/*--------------------------------------------------------------
Init
--------------------------------------------------------------*/
var Botkit = require('botkit'),
    cron   = require('node-cron'),
    config = require('./config'),
    db     = require('./firebase_db'),
    controller = Botkit.slackbot({
      debug: false
    });

/*--------------------------------------------------------------
Token
--------------------------------------------------------------*/
const token = config.bot_params.keyword,
      regex_token = new RegExp(token, "g"),
      regex_mention = new RegExp('<@.*>', "g");

/*--------------------------------------------------------------
Cron
--------------------------------------------------------------*/
cron.schedule('59 23 * * ' + config.schedule.days, function() {
  db.resetCoins();
});

/*--------------------------------------------------------------
Token Listener
--------------------------------------------------------------*/
controller.hears(':taco:', 'ambient', function(bot, message) {
  var mentioned_users = message.text.match(regex_mention),
      coins = message.text.match(regex_token).length,
      mention_user = mentioned_users[0].split(' ')[0],
      mention_id = mention_user.replace(/<|@|>/g, '');

  if (mentioned_users.length != 0
      && coins != 0
      && message.user != mention_id) {

    db.getCurrentCoins(message.user)
        .then(function(snapshot) {

        if (snapshot.val() < coins) {
          bot.reply(message, 'No tienes suficientes tokens prro');
        } else {

          bot.startPrivateConversation({ user: message.user },
            function(response, convo) {
              convo.say('You sent ' + coins + ' coins to ' + mention_user);
            });

          bot.startPrivateConversation({ user: mention_id },
            function(response, convo) {
              convo.say('You received ' + coins + ' coins from <@' + message.user + '>');
            });
        }
      })
      .then(function() {
        db.processExchange(message.user, mention_id, coins);
      });
  }
});

/*--------------------------------------------------------------
Dashboard Listener
--------------------------------------------------------------*/
controller.hears('show leaderboard', 'ambient', function(bot, message) {
  var users = [], leaderboard = [], lmessage = '';

  db.getUsers()
    .then(function(snapshot) {
      users = Object.keys(snapshot.val());

      for (user in users) {
        leaderboard.push([users[user], snapshot.child(users[user]).child('total_coins').val()]);
      }
      leaderboard.sort(function(a, b) {
        return b[1] - a[1];
      });

      // Modify to get only 5 when going live
      // for (i=0; i<5; i++) {
      for (i=0; i<leaderboard.length; i++) {
        lmessage = lmessage.concat('<@' + leaderboard[i][0] + '> : ' + leaderboard[i][1] + ' coins \n');
      }
      bot.reply(message, '=====Leaderboard===== \n ' + lmessage);
    });

});

/*--------------------------------------------------------------
Log every message received
--------------------------------------------------------------*/
controller.middleware.receive.use(function(bot, message, next) {
  console.log('RECEIVED: ', message);
  message.logged = true;
  next();
});

/*--------------------------------------------------------------
Log every message sent
--------------------------------------------------------------*/
controller.middleware.send.use(function(bot, message, next) {
  console.log('SENT: ', message);
  message.logged = true;
  next();
});

/*--------------------------------------------------------------
Bot starts
--------------------------------------------------------------*/
var bot = controller.spawn({
  token: config.slack.bot.token
}).startRTM();
