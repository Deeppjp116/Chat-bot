const mongoose = require('mongoose');

let dbURI;

if (process.env.NODE_ENV === 'production') {
  dbURI = process.env.MONGODB_URI;
  console.log('Connects to the URI ');
} else {
  dbURI = 'mongodb://localhost:27017/User';
  console.log('Connects to the Locally');
}

mongoose.connect(dbURI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  ssl: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = db;
