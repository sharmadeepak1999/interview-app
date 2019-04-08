const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
	firstname: {
		type: String,
		required: true,
		trim: true
	},
	lastname: {
		type: String,
		required: true,
		trim: true
	},
	gender: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	},
	registeredOn: {
		type: Date,
		required: true
	},
	lastLoggedIn: {
		type: Date,
		required: true
	}
})

UserSchema.statics.authenticate = (email, password, callback) => {
	User.findOne({ email }).exec((err, user) => {
		if(err){
			return callback(err)
		} else if(!user) {
			const err = new Error('User not found!')
			err.status = 401;
			return callback(err)
		}

		bcrypt.compare(password, user.password, (err, result) => {
			if(result === true) {
				return callback(null, user)
			} else {
				return callback()
			}
		})
	})
}

UserSchema.pre("save", function (next) {
	const user = this;
	bcrypt.hash(user.password, 10, (err, hash) => {
		if(err) {
			return next(err)
		}
		user.password = hash
		next()
	})
})

const User = mongoose.model('User', UserSchema);
module.exports = User