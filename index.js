const express = require("express");
const mongoose = require('mongoose');
const path = require("path");
const multer = require("multer");
const uploadModel = require('./models/upload.model');
const uuid = require("uuid").v4;
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/cloudinary');
const db = mongoose.connection;

db.once("open", () => console.log("database connected"));
db.on("error", (err) => console.log(err));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + "/bucket");
    },

    filename: function (req, file, cb) {
        cb(null, uuid());
    }

});



cloudinary.config({
    cloud_name: "dtmmwsnhm",
    api_key: "586468569349379",
    api_secret: "jzxgi5Fi_WodEBOTbvsvzWQnqOA",
});

var upload = multer({
    storage: storage,
});


app.post("/upload", upload.array("image"), async function (req, res) {

    let uploadedBy = req.headers.name;
    console.log(uploadedBy);

    for (let item of req.files) {
        let result = await cloudinary.uploader.upload(item.path, {
            folder: "/me"  // je folder banouna cloudinary ch
        });

        await uploadModel.create({
            uploadedBy: uploadedBy,
            file: result,
        });
        fs.unlinkSync(item.path);
    }
    // console.log(result);
    res.send("uploaded");
})

app.put("/update/:id", upload.single("image"), async (req, res) => {

    let id = req.params.id;
    let uploadedBy = req.headers.uploadedby;
    let image = req.file;

    let result = await uploadModel.aggregate([
        {
            $match: {
                uploadedBy: uploadedBy,
            }
        },
        {
            $project: {
                file: 1,
            }
        },
        {
            $match: {
                "file.public_id": "me/" + id
            }
        }
    ]);


    let newImage = await cloudinary.uploader.upload(image.path, {
        folder: "/me"
    })


    result.map(async (doc) => {
        let cloudDel = await cloudinary.api.delete_resources(doc.public_id, (result) => { console.log("deleted from cloudinary"); })
        await uploadModel.updateOne({ _id: doc._id }, { $set: { file: newImage } })
    })

    res.send("update completed")


});

app.delete("/delete/:id", async (req, res) => {
    let id = req.params.id;
    let name = req.body.uploadedBy;

    let result = await uploadModel.aggregate([
        {
            $match: {
                uploadedBy: name,
            }
        },
        {
            $project: {
                file: 1
            }
        },
        {
            $match: {
                "file.public_id": "me/" + id
            }
        }
    ]);

    result.map(async (doc) => {
        await uploadModel.deleteOne({ _id: doc._id })
    })

    let cloudDel = cloudinary.api.delete_resources("me/" + id, function (result) { console.log(cloudDel) });
    res.send({ msg: "deleted", result });
})



app.listen(8090, function (error) {
    if (error) throw error;
    console.log("Server created Successfully on PORT 8090");
});

