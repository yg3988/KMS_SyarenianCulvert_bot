const mongoose = require('mongoose');

const url = 'mongodb://127.0.0.1:27017/bot';

mongoose
	.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})
	.catch((e) => {
		console.error('Connection error', e.message);
	});

const db = mongoose.connection;

module.exports = db;
