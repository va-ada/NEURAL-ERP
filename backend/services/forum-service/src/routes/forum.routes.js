const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../shared/middleware/auth.middleware');
const { validateRequest } = require('../../../../shared/middleware/validate');
const { createPostValidator } = require('../validators/post.validators');
const { createReplyValidator } = require('../validators/reply.validators');
const ctrl = require('../controllers/forum.controller');

router.get('/posts', authenticate, ctrl.getPosts);
router.post('/posts', authenticate, createPostValidator, validateRequest, ctrl.createPost);
router.get('/posts/:id', authenticate, ctrl.getPost);
router.post('/posts/:id/reply', authenticate, createReplyValidator, validateRequest, ctrl.reply);
router.put('/posts/:id/like', authenticate, ctrl.toggleLike);

module.exports = router;
