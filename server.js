const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

const MONGODB_URI =
	'mongodb+srv://moatazabdalbaky:EhIinEffQubLk3IB@cluster0.tbhwzun.mongodb.net/message?retryWrites=true';

// middleware to parse json requist
app.use(bodyParser.json());

// serve the image folder staticly
app.use('/images', express.static(path.join(__dirname, 'images')));

// middleware to parse image from POST /feed/post requis
const storage = multer.diskStorage({
	destination: function (_, _1, callback) {
		callback(null, 'images');
	},
	filename: function (_, file, callback) {
		callback(null, Date.now() + '-' + file.originalname);
	},
});
const fileFilter = function (req, file, cb) {
	let ext = path.extname(file.originalname);
	if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
		req.fileValidationError = 'Forbidden extension';
		return cb(null, false, req.fileValidationError);
	}
	cb(null, true);
};
app.use(multer({ storage: storage, fileFilter: fileFilter }).single('image'));

// middleware to solve the CROS error
app.use((_, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
	next();
});

// feed routs
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
	console.log(err);
	res.status(err.statusCode).json({ error: err.message, data: err.data });
});
// conntect to database
mongoose
	.connect(MONGODB_URI)
	.then(() => {
		const server = app.listen(8080);
		const io = require('./socket').init(server, { cors: { origin: '*' } });
		io.on('connection', (socket) => {
			console.log('someone connected!');
		});
		console.log('connected')
		module.exports = app;

	})
	.catch((err) => {
		console.log(err);
		throw err;
	});
