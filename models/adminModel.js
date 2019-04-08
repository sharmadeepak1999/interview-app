const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const AdminSchema = new mongoose.Schema({
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
	adminRegisteredOn: {
		type: Date,
		required: true
	},
	lastLoggedIn: {
		type: Date,
		required: true
	}
})

AdminSchema.statics.authenticate = (email, password, callback) => {
	Admin.findOne({ email }).exec((err, admin) => {
		if(err){
			return callback(err)
		} else if(!admin) {
			const err = new Error('Admin not found!')
			err.status = 401;
			return callback(err)
		}

		bcrypt.compare(password, admin.password, (err, result) => {
			if(result === true) {
				return callback(null, admin)
			} else {
				return callback()
			}
		})
	})
}

AdminSchema.pre("save", function (next) {
	const admin = this;
	bcrypt.hash(admin.password, 10, (err, hash) => {
		if(err) {
			return next(err)
		}
		admin.password = hash
		next()
	})
})

const Admin = mongoose.model('Admin', AdminSchema);
module.exports = Admin