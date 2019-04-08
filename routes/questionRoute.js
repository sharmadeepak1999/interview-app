const express = require("express")
const {check, validationResult} = require("express-validator/check")
const multer = require("multer")
const fs = require("fs")
const bodyParser = require('body-parser');

const router = express.Router()

const Question = require("../models/questionModel.js")
const Answer = require("../models/answerModel.js")
const User = require("../models/userModel.js")
const Admin = require("../models/adminModel.js")

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		let folder = `videos/${req.session.userId}/`
		if(!fs.existsSync(folder)){
			fs.mkdirSync(folder)
		}
		cb(null, folder)
	},
	filename: (req, file, cb) => {
		cb(null, String(req.session.answerId))
	}
})

const limits = {
	files: 1,
	parts: 2,
	fileSize: 1024 * 1024 * 20
}

function fileFilter(req, file, cb) {
	console.log(file)
	let mimetype = file.mimetype
	let filename = file.originalname
	if(mimetype !== "video/webm" || filename !== "blob") {
		cb(new Error("Video file not supported!"))
	}else {
		cb(null, true)
	}

}

function isLoggedIn (req, res, next) {
  if (!(req.session && req.session.userId)) {
    return res.redirect("/user/login");
  }else {
  	User.findOne({ _id : req.session.userId }, function(err, user) {
  		if(err){
  			return next(err);
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


const upload = multer({ storage, fileFilter }).single("video")

router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())

router.get("/new", isLoggedIn, async (req, res, next) => {

	const questions = await Question.find({ answeredByIds: { $ne: req.session.userId } })

	if(!req.query.question_id){
		return res.render("./user/newQuestions", {
			pageTitle: "New Questions | GIIT-Interview-App",
			questions,
			question_id: null
		})
	}

	Question.findOne({ _id: req.query.question_id }, (error, question) => {
		if(error) {
			req.flash("danger", "Sorry an error occured, try again!")
			return res.render("./user/dashboard", {
				pageTitle: "Dashboard | GIIT-Interview-App"
			})
		}
		if(!question) {
			req.flash("danger", "No such question found!")
			return res.render("./user/newQuestions", {
				pageTitle: "New Questions | GIIT-Interview-App",
				questions,
				question_id: null
			})
		}
		res.render("./user/newQuestions", {
			pageTitle: "New Questions | GIIT-Interview-App",
			questions,
			question_id: JSON.stringify(question._id)
		})
	})
})

router.get("/answered", isLoggedIn, async (req, res) => {
	const questions = await Question.find({ answeredByIds: req.session.userId })

	if(!req.query.question_id){
		return res.render("./user/answeredQuestions", {
			pageTitle: "Answered Questions | GIIT-Interview-App",
			questions,
			question_id: null,
			answer_id: null
		})
	}
	Question.findOne({ _id: req.query.question_id }, async (error, question) => {
		if(error) {
			req.flash("danger", "Sorry an error occured, try again!")
			return res.render("./user/dashboard", {
				pageTitle: "Dashboard | GIIT-Interview-App"
			})
		}
		if(!question) {
			req.flash("danger", "No such question found!")
			return res.render("./user/answeredQuestions", {
				pageTitle: "Answered Questions | GIIT-Interview-App",
				questions,
				question_id: null,
				answer_id: null
			})
		}
		const answer = await Answer.findOne({ userId: req.session.userId, questionId: req.query.question_id})

		res.render("./user/answeredQuestions", {
			pageTitle: "Answered Questions | GIIT-Interview-App",
			questions,
			question_id: JSON.stringify(question._id),
			answer_id: JSON.stringify(answer._id)
		})
	})
})

router.get("/video", isLoggedIn, async (req, res) => {
	if(req.query.answer_id) {
		let answerId = req.query.answer_id

		const answer = await Answer.findOne({ _id: answerId, userId: req.session.userId })
		if(answer){
			const path = `videos/${req.session.userId}/${answerId}`
			const stat = fs.statSync(path)
			if(stat) {
				const fileSize = stat.size
				const range = req.headers.range
				if (range) {
				    const parts = range.replace(/bytes=/, "").split("-")
				    const start = parseInt(parts[0], 10)
				    const end = parts[1] 
				      ? parseInt(parts[1], 10)
				      : fileSize-1
				    const chunksize = (end-start)+1
				    const file = fs.createReadStream(path, {start, end})
				    const head = {
				      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				      'Accept-Ranges': 'bytes',
				      'Content-Length': chunksize,
				      'Content-Type': 'video/mp4',
				    }
				    res.writeHead(206, head);
				    file.pipe(res);
				} else {
				    const head = {
				      'Content-Length': fileSize,
				      'Content-Type': 'video/mp4',
				    }
				    res.writeHead(200, head)
				    fs.createReadStream(path).pipe(res)
				}
			}else {
				res.writeHead(400, null)
			}
		}
	}
})

router.post("/answer", isLoggedIn, async (req, res, next) => {

	let question_id = req.headers.question_id

	if(question_id) {
		const question = await Question.findOne({ _id: question_id })
		if(!question){
			return res.send({
				error: "No such question found",
				code: 404
			})
		}

		let answer = await Answer.findOne({ questionId: question_id, userId: req.session.userId })

		if(answer) {
			fs.unlinkSync(`videos/${req.session.userId}/${answer._id}`, (err) => {
				if(err){
					return res.send({
						error: "Unable to save video!",
						code: 500
					})
				}
			})
			await Answer.deleteOne({ _id: answer._id })
		}

		answer = {
			questionId: question_id,
			userId: req.session.userId,
			answerAddedOn: new Date()
		}

		answer = await Answer.create(answer)

		if(answer) {
			req.session.answerId = answer._id
			upload(req, res, async (err) => {
				if(err) {
					return res.send({
						error: "Cannot save video!",
						code: 500
					})
				}

				await Question.updateOne({ _id: question_id }, { $push: { answeredByIds : req.session.userId }})

				res.send({
					success: true,
					message: "Video Saved successfuly!!"
				})
			})
		}
	}
})

router.post("/add", [
		check("questionText").not().isEmpty().withMessage("Enter the question first!").trim().escape()
	], isAdminLoggedIn, async (req, res) => {
		const errors = validationResult(req)

		if(!errors.isEmpty()){
			req.flash("danger", errors.array()[0])
			return res.redirect("/giit-interview-admin/dashboard")
		}else {
			const question = {
				questionText: req.body.questionText,
				questionAddedOn: new Date(),
				answeredByIds: []
			}

			Question.create(question, (err) => {
				if(err){
					req.flash("danger", "Unable to add quesiton!")
					return res.redirect("/giit-interview-admin/dashboard")
				}else {
					req.flash("success", "Question added successfully!")
					res.redirect("/giit-interview-admin/dashboard")
				}
			})
		}
})

module.exports = router