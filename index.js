var Botkit = require('botkit');
var configuration = {
  debug: false
};
var controller = Botkit.slackbot(configuration);
var config = require('./config');

var cron = require('node-cron');
var db = require('./fb_db');

// Define the token
const token = ':taco:';
const regex_token = new RegExp(':taco:', "g");
const regex_mention = new RegExp('<@.*>', "g");

// Setup CRON to reset coins
cron.schedule('59 23 * * ' + config.schedule.days, function() {
  db.resetCoins();
});

// Listener for direct messages
// controller.hears(token, 'direct_message', function(bot, message) {
//
//   try {
//     // Get mentioned users
//     var mentioned_users = message.text.match(regex_mention);
//
//     // Get number of tokens
//     var coins = message.text.match(regex_token).length;
//
//     // Get only the first mentioned user
//     var mention_user = mentioned_users[0].split(' ')[0];
//
//     // Get the user ID
//     var mention_id = mentioned_users[0].split(' ')[0].replace(/<|@|>/g, '');
//
//     // Check if there are mentioned users AND token AND mentioned user is not
//     // the same as current user
//
//     if (mentioned_users.length != 0 && coins !=0 && message.user != mention_id) {
//
//       db.getCurrentCoins(message.user).then(function(snapshot) {
//
//         if (snapshot.val() < coins) {
//           bot.reply(message, 'No tienes suficientes tokens prro');
//         }
//
//       }).then(function() {
//
//         db.processExchange(message.user, mention_id, coins);
//
//       });
//
//     }
//
//   }
//   catch(err) {
//     console.warn('Error giving reward.' + err);
//   }
//
// });

// Listener for TOKEN channel messages
controller.hears(':taco:', 'ambient', function(bot, message) {

  var mentioned_users = message.text.match(regex_mention);
  var coins = message.text.match(regex_token).length;

  var mention_user = mentioned_users[0].split(' ')[0];
  var mention_id = mentioned_users[0].split(' ')[0].replace(/<|@|>/g, '');

  if (mentioned_users.length !=0 && coins !=0 && message.user != mention_id) {

    db.getCurrentCoins(message.user).then(function(snapshot) {

      if (snapshot.val() < coins) {
        bot.reply(message, 'No tienes suficientes tokens prro');
      } else {

        bot.startPrivateConversation({ user: message.user }, function(response, convo) {
          convo.say('You sent ' + coins + ' coins to ' + mention_user);
        });

        bot.startPrivateConversation({ user: mention_id }, function(response, convo) {
          convo.say('You received ' + coins + ' coins from <@' + message.user + '>');
        });

      }

    }).then(function() {

      db.processExchange(message.user, mention_id, coins);

    });

  }

});

// Listener for LEADERBOARD channerl messages
controller.hears('show', 'direct_message', function(bot,message) {

  var users = [];
  var leaderboard = [];
  var lmessage = '';

  db.getUsers().then(function(snapshot) {

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

controller.middleware.receive.use(function(bot, message, next) {

  // log it
  console.log('RECEIVED: ', message);

  // modify the message
  message.logged = true;

  // continue processing the message
  next();

});

// Log every message sent
controller.middleware.send.use(function(bot, message, next) {

  // log it
  console.log('SENT: ', message);

  // modify the message
  message.logged = true;

  // continue processing the message
  next();

});

var bot = controller.spawn({
  token: config.slack.bot.token
}).startRTM();
