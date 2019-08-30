const User = require('../models/user');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

module.exports = {
    //destucture nested objects to pull password, email and name from { {userInput: ...} }
    async createUser({ userInput: {password, email, name } }, req){
        const errors = [];
        if(!validator.isEmail(email)) {
            errors.push({message: 'Email is invalid'})
        }
        if(validator.isEmpty(password) || !validator.isLength(password, {min: 6})) {
            errors.push({message: 'Password must be at least 6 characters'})
        }
        if(errors.length > 0) {
            const error = new Error('Invalid input');
            error.data = errors;
            error.statusCode = 422;
            throw error;
        }
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            const error = new Error('User exists already!')
            throw error;
        }
        const hashedPass = await bcrypt.hash(password, 12)
        const user = new User({
            email, name, password: hashedPass
        });
        const createdUser = await user.save();
        return { ...createdUser._doc, _id: createdUser._id.toString() };
    },
    async login({email, password}) {
        const user = await User.findOne({ email });
        if(!user) {
            throw new Error('User not found')
        }
        const passMatch = await bcrypt.compare(password, user.password);
        if(!passMatch){
            throw new Error('Password is incorrect');
        }
        const token = jwt.sign({
           userId: user._id.toString(),
           email: user.email
        }, process.env.SECRET_KEY, {expiresIn: '30m'});
        return {token, userId: user._id.toString()};
    }
}