"use strict";

module.exports = function(mongoose) {

  let userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    fullName: String,
    email: {type: String, dropDups: true},
    emailVerified: {type: Boolean, "default": false},
    password: String,
    profilePic: String,
    bio: String,
    twitterHandle: String,
    dateCreated: {type: Date, "default": Date.now},
    status: {type: String, "default": "awaiting_approval"}
  });

  userSchema.virtual('fName').get(function() {
    return `${this.firstName} ${this.lastName}`;
  });

  return mongoose.model('User', userSchema);
};