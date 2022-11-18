const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const errorHandler = require('../helpers/error-handler');

exports.signup = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const err = new Error(errors.array());
		err.statusCode = 442;
		err.data = errors.array();
		throw err;
	}
	const email = req.body.email;
	const password = req.body.password;
	const name = req.body.name;
	bcrypt
		.hash(password, 12)
		.then((hashedPass) => {
			return new User({
				email,
				name,
				password: hashedPass,
			}).save();
		})
		.then((result) => {
			res.status(201).json({ message: 'User Created!'});
		})
		.catch((err) => errorHandler(err, next));
};

exports.login = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	let loadedUser;
	User.findOne({ email: email })
		.then((user) => {
			if (!user) {
				const err = new Error('User Not Found!');
				err.status = 401;
				throw err;
			}
			loadedUser = user;
			return bcrypt.compare(password, user.password);
		})
		.then((isMatch) => {
			if (!isMatch) {
				const err = new Error('Wrong Password!');
				err.status = 401;
				throw err;
			}
			const token = jwt.sign(
				{ email: loadedUser.email, userId: loadedUser._id.toString() },
				'thisissupersupersupersecretkeytogeneratethetoken',
				{ expiresIn: '2h' }
			);
			res.status(200).json({ token });
		})
		.catch((err) => errorHandler(err, next));
};
