var fs = require('fs'), config = {};

if (fs.existsSync('./config.json')) {
  config = require('./config.json');
  console.log('config loaded from config.json');
} else if(process.env.REWARDS_CONFIG) {
  config = JSON.parse(process.env.REWARDS_CONFIG);
  console.log('config loaded from ENV');
} else {
  console.error('there are no config.json or REWARDS_CONFIG var.');
}
module.exports = config;
