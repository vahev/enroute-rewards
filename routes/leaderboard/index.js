// const logger = require(`${base_path}/logger`)(__dirname);
var express = require('express');

var router = new express.Router(),
		db = require(`${base_path}/db`);

router.get('/all', async function (req, res) {
	const users = await db.getUsers();
	res.send(users);
});

router.get('/valid', async function (req, res) {
	const users = await db.getValidUsers();
	res.send(users);
});

router.get('/update', async function (req, res) {
	const users = db.updateUsersWithSlack();
	res.send(users);
})

module.exports = router;
