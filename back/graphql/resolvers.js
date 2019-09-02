const User = require('../models/user');
const Post = require('../models/post');
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
    },
    async createPost( { postInput: {title, content, imageUrl} }, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.statusCode = 401;
            throw error;
        }
        const errors = [];
        if(validator.isEmpty(title) || !validator.isLength(title, {min: 5})) {
            errors.push({message: 'Title is invalid'})
        }
        if(validator.isEmpty(content) || !validator.isLength(content, {min: 5})) {
          errors.push({message: 'Content is invalid'})
        }
        if(errors.length > 0) {
          const error = new Error('Invalid input');
          error.data = errors;
          error.statusCode = 422;
          throw error;
        }
        const user = await User.findById(req.userId);
        if(!user) {
            const error = new Error('Invalid user');
          error.data = errors;
          error.statusCode = 401;
          throw error;
        }
        const post = new Post( {
          title, content, imageUrl, creator: user
        });
        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();
        return {
          ...createdPost._doc,
          _id: createdPost._id.toString(),
          createdAt: createdPost.createdAt.toISOString(),
          updatedAt: createdPost.updatedAt.toISOString()
        }
    },
    async posts({page}, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.statusCode = 401;
            throw error;
        }
        if(!page) {
            page = 1;
        }
        const perPage = 2;
        let posts = await Post.find()
            .skip((page - 1) * perPage).limit(perPage).sort({createdAt: -1})
            .populate({path: 'creator', select: 'name'});
        posts = posts.map(post => { 
            return {
                ...post._doc,
                _id: post._id.toString(),
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
            }})
        const totalPosts = posts.length;
        return {posts, totalPosts};
    }
}