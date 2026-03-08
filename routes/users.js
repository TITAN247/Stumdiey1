const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/STY';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Did you add the correct MONGODB_URI environment variable?');
  });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profilePic: {
    type: String,
  },
  pdfDownloads: {
    type: Number,
    default: 0
  },
  pyqDownloads: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date
  },
  prevLogin: {
    type: Date
  },
  // New fields for personal info
  fullName: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  }
}, { timestamps: true });
userSchema.plugin(plm);

// Password validation helper
function isValidPassword(password) {
  // At least 8 chars, one letter, one number
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
}
module.exports=mongoose.model('User',userSchema);
module.exports.isValidPassword = isValidPassword;