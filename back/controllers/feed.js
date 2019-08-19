const { validationResult } = require('express-validator');
const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{
      _id: 1,
      title: 'First Post',
      content: 'This is the first post!',
      imageUrl: 'images/image.jpg',
      creator: { name: 'Ace'},
      createdAt: new Date()
     }]
  });
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
  // Create post in db
  const post = new Post({
    title,
    content,
    imageUrl: '/someimage.jpg',
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
