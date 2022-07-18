let mongoose = require("mongoose");

let uploadSchema = new mongoose.Schema({
    uploadedBy : String ,
    file : Object,
});

module.exports = uploadModel = mongoose.model('cloudinary' , uploadSchema , 'cloudinary');