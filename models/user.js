const mongoose=require("mongoose");


// mongoose.connect("mongodb://127.0.0.1:27017/miniproject");
const userSchema=mongoose.Schema({
    
    name:String,
    age:Number,
    email:String,
    password:String,
    image:{
      type:String,
      default:"default.webp"
    },
   posts: { type: [mongoose.Schema.Types.ObjectId],
     ref: "post", 
     default: []
     }
});
module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
