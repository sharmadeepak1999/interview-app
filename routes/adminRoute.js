const { check, validationResult } = require("express-validator/check")
const express = require("express")

//create express router
const router = express.Router()

const Question = require("../models/questionModel.js")
const Admin = require("../models/adminModel.js")


// Function to check whether the admin is logged in
function isAdminLoggedIn (req, res, next) {
  if (!(req.session && req.session.adminId)) {
    return res.redirect("/giit-interview-admin/login");
  }else {
  	Admin.findOne({ _id : req.session.adminId }, function(err, admin) {
  		if(err){
  			req.flash("danger", "Unauthorized Admin! Please Login.")
  			return res.redirect("/giit-interview-admin/login")
  		}else {
	  			if(admin) {
	  				next();
	  			}else {
	  				req.session.destroy();
	  				return res.redirect("/giit-interview-admin/login");
	  			}
  		}
  	});
  }
}

// Function to check whether the admin is logged out
function isAdminLoggedOut (req, res, next) {
  if (req.session && req.session.adminId) {
    return res.redirect("/giit-interview-admin/dashboard");
  }
  next();
}

router.get("/login", isAdminLoggedOut, (req, res) => {
	res.render("./admin/login", {
		pageTitle: "Admin Login | GIIT-Interview-App",
		email: "",
    adminLoggedIn: null
	})
})

router.post("/login", isAdminLoggedOut, [
    check("email").not().isEmpty().withMessage("Enter your email!").isEmail().withMessage("Invalid Email!").trim().escape(),
    check("password").not().isEmpty().withMessage("Enter your Password!").trim().escape()
  ], (req, res) => {

    let email = req.body.email
    let password = req.body.password

    let errors = validationResult(req)

    if(!errors.isEmpty()){
      return res.render("/admin/login", {
        pageTitle: "Admin Login | GIIT-Interview-App",
        email,
        errors: errors.array()
      })
    }else {
      Admin.authenticate(email, password, (error, admin) => {
      if(error || !admin) {
        req.flash("danger", "Incorrect email or password!")
        res.render("./admin/login", {
          pageTitle: "Admin Login | GIIT-Interview-App",
          email: req.body.email
        })
      }else {
        req.session.adminId = admin._id
        req.session.adminLoggedIn = true
        req.session.adminFirstName = admin.firstname
        req.session.adminLastName = admin.lastname
        console.log(admin.firstname)
        return res.redirect("/giit-interview-admin/dashboard")
      }
    })
    }
})


router.get('/logout', isAdminLoggedIn, (req, res) => {
  Admin.updateOne({ _id: req.session.adminId }, { lastLoggedIn: new Date() }, (error, admin) => {
    if(error) {
      req.flash("danger", "Unable to logout!")
      return res.render("./admin/dashboard", {
        pageTitle: "Admin Dashboard | GIIT-Interview-App"
      })
    }
    if(req.session) {
      req.session.destroy((err) => {
        if(err) {
          req.flash("danger", "Unable to logout!")
          return res.render("./admin/dashboard", {
            pageTitle: "Admin Dashboard | GIIT-Interview-App"
          })
        } else {
          return res.redirect("/giit-interview-admin/login")
        }
      })
    }
  })
})


router.get("/dashboard", isAdminLoggedIn, async (req, res) => {
  let questions = await Question.find({})
	res.render("./admin/dashboard", {
		pageTitle: "Admin Dashboard | GIIT-Interview-App",
    questions: questions
	})
})

module.exports = router