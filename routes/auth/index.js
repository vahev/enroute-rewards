var express = require('express');

var router = new express.Router(),
		passport = require('passport');

router.get('/slack', passport.authorize('Slack'));

router.get('/slack/callback',
	passport.authenticate('Slack', { failureRedirect: '/' }),
	(req, res) => res.redirect('/')
);


module.exports = router;
