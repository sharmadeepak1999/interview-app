const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
	questionId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	answerAddedOn: {
		type: Date,
		required: true,
	}
})

const Answer = mongoose.model('Answer', AnswerSchema);
module.exports = Answer