const { validationResult } = require('express-validator');
const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  Post.find()
    .then(posts => {
      res.status(200).json({
        message: 'Fetched posts successfully',
        posts
      })
    })
    .catch(err => {
      if(!err.statusCode) {
        err.statusCode = 500;
        next(err)
      }
    })
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if(!post) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Post fetched', post });
    })
    .catch(err => {
      if(!err.statusCode) {
        err.statusCode = 500;
        next(err)
      }
    })
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  const validationErrors = validationResult(req);
  if(!validationErrors.isEmpty()) {
    const error = new Error('Validation failed, please enter valid data');
    error.statusCode = 422;
    return next(error);
  }
  if(!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }
  const path = req.file.path.includes('\\') ? req.file.path.replace(/\\/g,"/") : req.file.path;
  console.log(path);
  const post = new Post({
    title,
    content,
    imageUrl: path,
    creator: { name: 'Ace'}
  });
  post.save()
    .then(result => {
      res.status(201).json({
        message: 'Post created successfully!',
        post: result
      });
    })
    .catch(err => {
      if(!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
