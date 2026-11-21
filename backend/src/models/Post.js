const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    author: { type: String, required: [true, 'Author is required'], trim: true, maxlength: 100 },
    contents: { type: String, required: [true, 'Contents are required'] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Post', postSchema);
