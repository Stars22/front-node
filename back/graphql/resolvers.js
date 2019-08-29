const User = require('../models/user');
const bcrypt = require('bcryptjs');

module.exports = {
    //destucture nested objects to pull password, email and name from {args}
    async createUser({ userInput: {password, email, name } }, req){
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
    }
}