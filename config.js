var fs = require('fs'), config = {};

if (fs.existsSync('/config.json')) {
  config = require('./config.json');
} else if(process.env.REWARDS_CONFIG) {
  config = JSON.parse(process.env.REWARDS_CONFIG);
} else {
  console.error('there are no config.json or REWARDS_CONFIG var.');
}
module.exports = config;
