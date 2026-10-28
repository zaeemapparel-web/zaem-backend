import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = express.Router();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Sahi tareeqa: cloudinary.v2 pass karein
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2, 
  params: {
    folder: "zaem_products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage: storage });

router.post("/", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("❌ Cloudinary Error:", err);
      return res.status(500).json({ success: false, message: "Upload failed", error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.status(200).json({ success: true, url: req.file.path });
  });
});

export default router;