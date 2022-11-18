const jwt = require('jsonwebtoken');

module.exports = (req, _, next) => {
	const authHead = req.get('Authorization');
	if (!authHead) {
		const err = new Error('Not Authenticated');
		err.statusCode = 401;
		throw err;
	}
	const token = authHead.split(' ')[1];
	let decodedToken;
	try {
		decodedToken = jwt.verify(
			token,
			'thisissupersupersupersecretkeytogeneratethetoken'
		);
	} catch (err) {
		throw err;
	}
	if (!decodedToken) {
		const err = new Error('Not Authenticated');
		err.statusCode = 401;
		throw err;
	}
	req.userId = decodedToken.userId;
	next();
};
