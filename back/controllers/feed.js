const { validationResult } = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const io = require('../socket');

exports.getPosts = (req, res, next) => {
  const postsLimit = 2;
  const currentPage = req.query.page || 1;
  let totalItems;
  Post.find().countDocuments()
    .then(count => {
      totalItems = count;
      return Post.find().populate({path: 'creator', select: 'name'})
        .skip((currentPage - 1) * postsLimit)
        .limit(postsLimit);
    })
    .then(posts => {
      res.status(200).json({
        message: 'Fetched posts successfully',
        posts,
        totalItems
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
  let creator;
  const post = new Post({
    title,
    content,
    imageUrl: path,
    creator: req.userId
  });
  post.save()
    .then(_ => {
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then(result => {
      io.getIo().emit('posts', { action: 'create', post: {...post._doc, creator: {name: creator.name}} })
      res.status(201).json({
        message: 'Post created successfully!',
        post: post,
        creator: {_id: creator._id, name: creator.name}
      });
    })
    .catch(err => {
      if(!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const validationErrors = validationResult(req);
  if(!validationErrors.isEmpty()) {
    const error = new Error('Validation failed, please enter valid data');
    error.statusCode = 422;
    return next(error);
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if(req.file) {
    imageUrl = req.file.path.includes('\\') ? req.file.path.replace(/\\/g,"/") : req.file.path;
  }
  if(!imageUrl) {
    const error = new Error('No image picked');
    error.statusCode = 422;
    return next(error);
  }
  Post.findById(postId).populate('creator')
    .then(post => {
      if(!post) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      if(imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      if(post.creator._id.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save()
    })
    .then(result => {
      io.getIo().emit('posts', {action: 'update', post: result})
      res.status(200).json({ message: 'Post updated', post: result });
    })
    .catch(err => {
      if(!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if(!post) {
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      if(post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({message: 'Post was deleted'});
    })
    .catch(err => {
      if(!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

function clearImage(filePath) {
  const picturePath = path.join(__dirname, '..', filePath);
  fs.unlink(picturePath, err => console.log(err));
}