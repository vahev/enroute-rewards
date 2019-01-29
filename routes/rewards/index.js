const logger = require('./../../logger')(__dirname);
var express = require('express');

var router = new express.Router(),
		config = require(`${base_path}/config`),
		rewards = require(`${base_path}/rewards`);

router.get('/all', async function (req, res) {
	const rewards = await config.getRewards();
	res.send(rewards);
});

router.post('/update', async function (req, res) {
	const updated = await rewards.updateReward(req.body);
	res.send(updated);
});

router.post('/redeem', function (req, res) {
	logger(req.body);
	logger(req.user);
	// const updated = await rewards.updateReward(req.body);
	res.send(true);
});

router.delete('/delete/:id', async function (req, res) {
	const deleted = await rewards.deleteReward(req.params.id);
	res.send(deleted);
});

module.exports = router;
