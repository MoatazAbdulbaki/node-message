const errorHandler = (error, next) => {
	error.statusCode = error.status || 500;
	return next(error);
};

module.exports = errorHandler
