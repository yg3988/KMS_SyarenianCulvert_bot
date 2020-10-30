const mongoose = require('mongoose');
const Member = require('./member-model');
const Schema = mongoose.Schema;

const GuildsSchema = new Schema(
	{
		gid: { type: String, required: true },
		members: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
	},
	{ versionKey: false }
);

module.exports = mongoose.model('Guild', GuildsSchema);
