const express = require('express');
const { body } = require('express-validator');
const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post(
	'/post',
	isAuth,
	[
		body('title').trim().isLength({ min: 5 }),
		body('content').trim().isLength({ min: 5 }),
	],
	feedController.createPost
);

// GET /feed/posts/postId
router.get('/posts/:postId', isAuth, feedController.getPostById);

// PUT /feed/posts/postId
router.put(
	'/posts/:postId',
	isAuth,
	[
		body('title').trim().isLength({ min: 5 }),
		body('content').trim().isLength({ min: 5 }),
	],
	feedController.updatePost
);

// DELETE /feed/posts/postId
router.delete('/posts/:postId', isAuth, feedController.deletePost);

// GET /feed/status
router.get('/status',isAuth,feedController.getStatus)

// PUT /feed/status
router.put(
	'/status',
	isAuth,
	[body('status').trim().isLength({ min: 4 })],
	feedController.updateStatus
);

module.exports = router;
