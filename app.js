//require npm packages
const bodyParser = require('body-parser');
const ejs = require("ejs")
const express = require("express")
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const DeviceDetector = require("device-detector-js");


//create an app with express
const app = express()

//set the server port number
const port = process.env.PORT || 3000

//connect to mongodb
mongoose.connect("mongodb+srv://admin-deepak:hNJmGwp24M4Y6LI6@cluster0-hh7uz.mongodb.net/interview?retryWrites=true", {useNewUrlParser: true})

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

//create connection variable
const db = mongoose.connection


//check for error database connection error
db.on('error', console.error.bind(console, "connection error:"))

//notify when connected to db
db.once("open", () => {
	console.log("Connected to mongoDB.")
})

//set view render engine to ejs
app.set("view engine", "ejs")

//setup express-messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});


//use express-session
app.use(session({
	secret: 'giit college 2019 mock interview',
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({
		mongooseConnection: db
	})
}))

//set app local variable
app.use(function(req, res, next) {
  res.locals.userFirstName = req.session.userFirstName;
  res.locals.userLastName = req.session.userLastName;
  res.locals.loggedIn = req.session.loggedIn;
  res.locals.adminFirstName = req.session.adminFirstName;
  res.locals.adminLastName = req.session.adminLastName;
  res.locals.adminLoggedIn = req.session.adminLoggedIn;
  res.locals.question_id = ""
  res.locals.errors = null
  next();
});

//use public folder as static content
app.use(express.static("public"));

//initialise bodyParser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//import all routes
const userRoute = require("./routes/userRoute.js")
const adminRoute = require("./routes/adminRoute.js")
const questionRoute = require("./routes/questionRoute.js")

//initialise routes
app.use("/user", userRoute)
app.use("/giit-interview-admin", adminRoute)
app.use("/question", questionRoute)

//check client browser version
app.use((req, res, next) => {
	const deviceDetector = new DeviceDetector();
	const device = deviceDetector.parse(req.headers['user-agent'])

	if(device.client.version < 70) {
		return res.render("update-browser", {
			pageTitle: "Warning | GIIT-Interview-App",
			browserVersion: device.client.version
		})
	}
	next()
})

//set root route
app.get("/", (req, res, next) => {
	if(req.session.userId) {
		return res.redirect("/user/dashboard")
	}
	res.render("index", {
		pageTitle: "GIIT-Interview-App"
	})
})

//set question route, admin specific
app.get("/question", (req, res) => {
	res.render("question")
})

//set add question route, admin specific
app.post("/question/add", (req, res, next) => {
	if(req.body.question) {
		const question = {
			questionText: req.body.question,
			questionAddedOn: new Date()
		}

		Question.create(question, (error, question) => {
			if(error){
				return next(error)
			}

			res.redirect("/question")
		})
	}
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

//Config Server to listen on 'port'
app.listen(port, () => {
	console.log("Server started at port 3000..")
})
