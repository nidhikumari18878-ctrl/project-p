const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },

  filename:String,
  skills:[String],

  atsScore:Number,

  missingSkills:[String],

  suggestions:[String],


  // createdAt:{
  //   type:Date,
  //   default:Date.now
  // },

 }, {
    timestamps:true
});

module.exports = mongoose.model("Resume",resumeSchema);