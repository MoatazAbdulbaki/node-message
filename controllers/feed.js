const Post = require('../models/post');
const User = require('../models/user');
const clearImage = require('../helpers/clear-image');
const errorHandler = require('../helpers/error-handler');
const io = require('../socket');
const { validationResult } = require('express-validator');

exports.getPosts = (req, res, next) => {
	const currentPage = req.query.page || 1;
	const POSTS_PER_PAGE = 2;
	let totalItems;
	Post.find()
		.countDocuments()
		.then((total) => {
			totalItems = total;
			return Post.find()
				.populate('creator')
				.sort({ createdAt: -1 })
				.skip((currentPage - 1) * POSTS_PER_PAGE)
				.limit(POSTS_PER_PAGE);
		})

		.then((posts) => {
			if (!posts) {
				const err = new Error('Posts Not Found');
				err.statusCode = 404;
				throw err;
			}
			res.status(200).json({ posts: posts, totalItems });
		})
		.catch((err) => errorHandler(err, next));
};

exports.createPost = (req, res, next) => {
	const title = req.body.title;
	const content = req.body.content;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const err = new Error(errors.array());
		err.statusCode = 442;
		throw err;
	}
	if (!req.file) {
		const err = new Error('No Image Provided!');
		err.statusCode = 422;
		throw err;
	}
	let createdPost;
	const imageUrl = req.file.path;
	Post.create({
		title,
		imageUrl,
		content,
		creator: req.userId,
	})
		.then((post) => {
			createdPost = post;
			User.findById(req.userId)
				.then((user) => {
					user.posts.push(createdPost);
					return user.save();
				})
				.then((result) => {
					io.getIO().emit('posts', {
						action: 'create',
						post: {
							...createdPost._doc,
							creator: { name: result.name, _id: req.userId },
						},
					});
					res.status(201).json({
						message: 'Post Created Successfully!',
						post: createdPost,
						creator: result.name,
					});
				});
		})
		.catch((err) => errorHandler(err, next));
};

exports.getPostById = (req, res, next) => {
	const postId = req.params.postId;
	Post.findById(postId)
		.populate('creator')
		.then((post) => {
			if (!post) {
				const err = new Error('Post Not Found');
				err.statusCode = 404;
				throw err;
			}
			return res.status(200).json({ post });
		})
		.catch((err) => errorHandler(err, next));
};

exports.updatePost = (req, res, next) => {
	const postId = req.params.postId;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const err = new Error(errors.array());
		err.statusCode = 442;
		throw err;
	}
	const title = req.body.title;
	const content = req.body.content;
	let imageUrl = req.body.image;
	if (req.file) {
		imageUrl = req.file.path;
	}
	if (!imageUrl) {
		const err = new Error('No Image Provided!');
		err.statusCode = 422;
		throw err;
	}
	Post.findById(postId)
		.populate('creator')
		.then((post) => {
			if (!post) {
				const err = new Error('Post Not Found');
				err.statusCode = 404;
				throw err;
			}
			if (post.creator._id.toString() !== req.userId) {
				const err = new Error('Not Autharized');
				err.statusCode = 401;
				throw err;
			}
			if (imageUrl !== post.imageUrl) {
				clearImage(post.imageUrl);
			}
			post.title = title;
			post.content = content;
			post.imageUrl = imageUrl;
			return post.save();
		})
		.then((result) => {
			io.getIO().emit('posts', { action: 'update', post: result });
			res.status(200).json({ message: 'Update Post Success', post: result });
		})
		.catch((err) => errorHandler(err, next));
};

exports.deletePost = (req, res, next) => {
	const postId = req.params.postId;
	Post.findById(postId)
		.then((post) => {
			if (!post) {
				const err = new Error('Post Not Found');
				err.statusCode = 404;
				throw err;
			}
			if (post.creator._id.toString() !== req.userId) {
				const err = new Error('Not Autharized');
				err.statusCode = 401;
				throw err;
			}
			clearImage(post.imageUrl);
			return post.delete();
		})
		.then(() => {
			return User.findById(req.userId);
		})
		.then((user) => {
			user.posts.pull(postId);
			return user.save();
		})
		.then(() => {
			io.getIO().emit('posts', { action: 'delete', post: postId });
			res.status(200).json({ message: 'Delete Post Success' });
		})
		.catch((err) => errorHandler(err, next));
};

exports.getStatus = (req, res, next) => {
	User.findById(req.userId)
		.then((user) => {
			res.status(200).json({ status: user.status });
		})
		.catch((err) => errorHandler(err, next));
};

exports.updateStatus = (req, res, next) => {
	const userId = req.userId;
	const status = req.body.status;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const err = new Error(errors.array());
		err.statusCode = 442;
		throw err;
	}
	User.findById(userId)
		.then((user) => {
			user.status = status;
			return user.save();
		})
		.then(() => {
			res.status(200).json({ message: 'Status Updated!', userId: userId });
		})
		.catch((err) => errorHandler(err, next));
};
