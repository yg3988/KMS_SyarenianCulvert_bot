const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MemberSchema = new Schema(
	{
		nickname: { type: String, required: true },
		job: { type: String, required: true },
		lv: { type: Number, required: true },
		stage: { type: Number, required: true },
	},
	{ versionKey: false }
);

module.exports = mongoose.model('Member', MemberSchema);
