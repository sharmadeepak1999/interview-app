const DeviceDetector = require("device-detector-js");
const { check, validationResult } = require("express-validator/check")
const express = require("express")

//create express router
const router = express.Router()

const User = require("../models/userModel.js")

// Function to check whether the user is logged in
function isLoggedIn (req, res, next) {
  if (!(req.session && req.session.userId)) {
    return res.redirect("/user/login");
  }else {
  	User.findOne({ _id : req.session.userId }, function(err, user) {
  		if(err){
  			req.flash("danger", "Unauthorized User! Please Login.")
  			return res.redirect("/user/login")
  		}else {
	  			if(user) {
	  				next();
	  			}else {
	  				req.session.destroy();
	  				return res.redirect("/user/login");
	  			}
  		}
  	});
  }
}

// Function to check whether the user is logged out
function isLoggedOut (req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect("/user/dashboard");
  }
  next();
}


router.get("/register", isLoggedOut, (req, res) => {
	res.render("./user/register", {
		pageTitle: "Register | GIIT-Interview-App",
		firstname: "",
		lastname: "",
		email: ""
	})
})

router.get("/login", isLoggedOut, (req, res) => {
	res.render("./user/login", {
		pageTitle: "Login | GIIT-Interview-App",
		email: ""
	})
})

router.post("/register", isLoggedOut, [
		check("firstname").not().isEmpty().withMessage("Enter your firstname!").trim().escape(),
		check("lastname").not().isEmpty().withMessage("Enter your lastname!").trim().escape(),
		check("email").not().isEmpty().withMessage("Enter your email!").isEmail().withMessage("Invalid email!").trim().escape(),
		check("gender").not().isEmpty().withMessage("Select your gender!").isIn(["male", "female"]).withMessage("Invalid gender!").trim().escape(),
		check("password").not().isEmpty().withMessage("Enter your password!").trim().escape(),
		check("confirmPassword").not().isEmpty().withMessage("Confirm your password!").custom((value, { req }) => value === req.body.password).withMessage("Entered Password does not match!")
	], async (req, res) => {

		let firstname = req.body.firstname
		let lastname = req.body.lastname
		let email = req.body.email

		let errors = validationResult(req)

		if(!errors.isEmpty()){
			res.render("./user/register", {
				pageTitle: "Register | GIIT-Interview-App",
				errors: errors.array(),
				firstname: firstname,
				lastname: lastname,
				email: email
			})
		}else {
			let user = await User.findOne({ email })

			if(user){
				req.flash("danger", "Sorry email has already been taken!")
				res.render("./user/register", {
					pageTitle: "Register | GIIT-Interview-App",
					email: "",
					firstname: firstname,
					lastname: lastname
				})
			}
			let userData = {
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				gender: req.body.gender,
				email: req.body.email,
				password: req.body.password,
				registeredOn: new Date(),
				lastLoggedIn: new Date()
			}

			User.create(userData, (error, user) => {
				if(error) {
					req.flash("danger", "Unable to register currently!")
					return res.render("./user/register", {
						pageTitle: "Register | GIIT-Interview-App"
					})
				}
				req.session.loggedIn = true
				req.session.userId = user._id
				req.session.userFirstName = user.firstname
				req.session.userLastName = user.lastname
				return res.redirect("/user/dashboard")
			})
		}
})

router.post("/login", isLoggedOut, [
		check("email").not().isEmpty().withMessage("Enter your email!").isEmail().withMessage("Invalid Email!").trim().escape(),
		check("password").not().isEmpty().withMessage("Enter your Password!").trim().escape()
	], (req, res) => {

		let email = req.body.email
		let password = req.body.password

		let errors = validationResult(req)

		if(!errors.isEmpty()){
			return res.render("/user/login", {
				pageTitle: "Login | GIIT-Interview-App",
				email,
				errors: errors.array()
			})
		}else {
			User.authenticate(email, password, (error, user) => {
			if(error || !user) {
				req.flash("danger", "Incorrect email or password!")
				res.render("./user/login", {
					pageTitle: "Login | GIIT-Interview-App",
					email: req.body.email
				})
			}else {
				req.session.userId = user._id
				req.session.loggedIn = true
				req.session.userFirstName = user.firstname
				req.session.userLastName = user.lastname
				return res.redirect("/user/dashboard")
			}
		})
		}
})


router.get('/logout', isLoggedIn, (req, res) => {
	User.updateOne({ _id: req.session.userId }, { lastLoggedIn: new Date() }, (error, user) => {
		if(error) {
			req.flash("danger", "Unable to logout!")
			return res.render("./user/dashboard", {
				pageTitle: "Dashboard | GIIT-Interview-App"
			})
		}
		if(req.session) {
			req.session.destroy((err) => {
				if(err) {
					req.flash("danger", "Unable to logout!")
					return res.render("./user/dashboard", {
						pageTitle: "Dashboard | GIIT-Interview-App"
					})
				} else {
					return res.redirect("/")
				}
			})
		}
	})
})

router.get("/dashboard", isLoggedIn, (req, res) => {
	res.render("./user/dashboard", {
		pageTitle: "Dashboard | GIIT-Interview-App"
	})
})

module.exports = router