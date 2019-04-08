const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
	questionText: {
		type: String,
		required: true,
		trim: true
	},
	questionAddedOn: {
		type: Date,
		required: true,
		trim: true
	},
	answeredByIds: [{
		type: mongoose.Schema.Types.ObjectId,
		required: true
	}]
})

const Question = mongoose.model('Question', QuestionSchema);
module.exports = Question