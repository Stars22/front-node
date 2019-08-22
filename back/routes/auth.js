const router = require('express').Router();
const { body } = require('express-validator');
const User = require('../models/user');
const authController = require('../controllers/auth');

router.put('/signup', [
    body('email').isEmail().withMessage('Please enter a valid email')
      .custom(input => {
        return User.findOne({email: input})
          .then(userDoc => {
            if(userDoc) {
              console.log('email found');
              return Promise.reject('The email is already in use')
            }
          })
      }).normalizeEmail(),
    body('password').trim().isLength({min: 6}),
    body('name').trim().not().isEmpty()
], authController.signup);

module.exports = router;