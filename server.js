const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

const { 
    S3Client, 
    ListObjectsV2Command, 
    GetObjectCommand 
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();

// ==========================
// FIX: Views folder path
// ==========================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==========================
// AWS S3 CONFIG
// ==========================
const s3 = new S3Client({
    region: "us-east-1", // change if needed
    credentials: {
        accessKeyId: "AKIAYUGFHWKR3YM4DDHR",
        secretAccessKey: "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"
    }
});

const BUCKET_NAME = "uma-34";

// ==========================
// MULTER S3 STORAGE
// ==========================
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        acl: "public-read", // optional
        key: function (req, file, cb) {
            cb(null, Date.now() + "-" + file.originalname);
        }
    })
});

// ==========================
// ROUTE: HOME (Upload + List)
// ==========================
app.get("/home", async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME
        });

        const data = await s3.send(command);

        const files = data.Contents 
            ? data.Contents.map(file => file.Key) 
            : [];

        res.render("home", { files });

    } catch (error) {
        console.log(error);
        res.send("Error loading files");
    }
});

// Upload to S3
app.post("/upload", upload.single("file"), (req, res) => {
    res.redirect("/home");
});

// ==========================
// ROUTE: DOWNLOAD PAGE
// ==========================
app.get("/download", async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME
        });

        const data = await s3.send(command);

        const files = data.Contents 
            ? data.Contents.map(file => file.Key) 
            : [];

        res.render("download", { files });

    } catch (error) {
        console.log(error);
        res.send("Error loading files");
    }
});

// ==========================
// SECURE DOWNLOAD (Signed URL)
// ==========================
app.get("/download/:filename", async (req, res) => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: req.params.filename
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 60 });

        res.redirect(url);

    } catch (error) {
        console.log(error);
        res.send("Error downloading file");
    }
});

// ==========================
// START SERVER
// ==========================
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000/home");
});
