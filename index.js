var Botkit = require('botkit');
var configuration = {
  debug: true
};
var controller = Botkit.slackbot(configuration);
var config = require('./config');

controller.hears('hello','direct_message', function(bot, message) {
  console.log('')
  bot.reply(message,'Hello yourself!');
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
