const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

// PUT /auth/signin
router.put(
	'/signup',
	[
		body('email')
			.trim()
			.isEmail()
			.normalizeEmail()
			.custom((value) => {
				return User.findOne({ email: value }).then((userDoc) => {
					if (userDoc) {
						return Promise.reject('email already exist');
					}
				});
			}),
		body('password').trim().isLength({ min: 6 }),
		body('name').trim().not().isEmpty(),
	],
	authController.signup
);

router.post('/login',authController.login)
module.exports = router;
