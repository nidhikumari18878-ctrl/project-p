const mongoose=require("mongoose");
// mongoose.connect("mongodb://127.0.0.1:27017/miniproject");

const opportunitySchema =mongoose.Schema({
    
   companyName:String,
    role:String,
    type:String,
    location:String,
    stipend:String,
    deadline:String,
    applyLink:String,
    logo:String,
    skills:[String],
    createdAt:{
        type:Date,
        default:Date.now
    }

});
module.exports=mongoose.model("Opportunity",opportunitySchema);