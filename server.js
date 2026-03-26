const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ==========================
// Ensure uploads folder exists
// ==========================
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ==========================
// View engine setup
// ==========================
app.set("view engine", "ejs");

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// ==========================
// Multer Storage Config
// ==========================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// ==========================
// ROUTE: /home (Upload + List)
// ==========================
app.get("/home", (req, res) => {
    let files = [];

    try {
        files = fs.readdirSync(uploadDir);
    } catch (err) {
        console.log("Error reading files:", err);
    }

    res.render("home", { files });
});

// Upload file
app.post("/upload", upload.single("file"), (req, res) => {
    res.redirect("/home");
});

// ==========================
// ROUTE: /download (List + Download)
// ==========================
app.get("/download", (req, res) => {
    let files = [];

    try {
        files = fs.readdirSync(uploadDir);
    } catch (err) {
        console.log("Error reading files:", err);
    }

    res.render("download", { files });
});

// Download specific file
app.get("/download/:filename", (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.send("File not found");
    }
});

// ==========================
// Start Server
// ==========================
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/home`);
});