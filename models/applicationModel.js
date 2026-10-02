const mongoose = require("mongoose");

const applicationSchema = mongoose.Schema({
    companyName: String,
    role: String,
    status: String,
    location: String,
    
    package: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }
});

module.exports = mongoose.model("application", applicationSchema);