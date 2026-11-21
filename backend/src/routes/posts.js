const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Only keep the fields a client is allowed to set
function pickPostFields(body = {}) {
  const fields = {};
  for (const key of ['title', 'author', 'contents', 'tags']) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  return fields;
}

// GET /api/v1/posts?author=&tag=&sortBy=createdAt&sortOrder=descending
router.get('/', async (req, res, next) => {
  try {
    const { author, tag, sortBy = 'createdAt', sortOrder = 'descending' } = req.query;
    const filter = {};
    if (author) filter.author = String(author);
    if (tag) filter.tags = String(tag);
    const allowedSort = ['createdAt', 'updatedAt', 'title'];
    const field = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const posts = await Post.find(filter).sort({ [field]: sortOrder === 'ascending' ? 1 : -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/posts/:id
router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid post id' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/posts
router.post('/', async (req, res, next) => {
  try {
    const post = await Post.create(pickPostFields(req.body));
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/posts/:id
router.patch('/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid post id' });
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: pickPostFields(req.body) },
      { new: true, runValidators: true },
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/posts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid post id' });
    const result = await Post.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Post not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
