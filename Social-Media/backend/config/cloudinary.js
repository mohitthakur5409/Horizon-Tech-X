 const cloudinary = require("./cloudinary");

app.post("/upload", async (req, res) => {
  try {
    const file = req.files.image; // assuming you're using express-fileupload or multer
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "social_media_posts",
      transformation: [{ width: 500, height: 500, crop: "fill" }]
    });
    res.json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});