const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    const validationErrors = validationResult(req);
    if(!validationErrors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 422;
      error.data = validationErrors.errors;
      throw error;
    }
    const { email, password, name } = req.body;
    bcrypt.hash(password, 12)
      .then(encryptedPass => {
        const user = new User( {
          email, name, password: encryptedPass
        });
        return user.save()
      })
      .then(result => {
        res.status(201).json({message: 'User created', userId: result._id})
      })
      .catch(err => {
        if(!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
}

exports.login = (req, res, next) => {
  const email = req.body.email;
  let loadedUser;
  User.findOne( { email })
    .then(user => {
      if(!user) {
        const error = new Error('The user doesnt exist')
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(req.body.password, user.password)
    })
    .then(isPasswordMatch => {
      if(!isPasswordMatch){
        const error = new Error('Wrong password');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign({
        email: loadedUser.email,
        userId: loadedUser._id.toString()
      }, process.env.SECRET_KEY, {expiresIn: '15m'});
      res.status(200).json({ token, userId: loadedUser._id.toString()})
    })
    .catch(err => {
      if(!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}