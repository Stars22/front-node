const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

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