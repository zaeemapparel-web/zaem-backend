import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 🔴 Cloudinary Config - Yahan Keys Render se uthai ja rahi hain
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔴 Storage Setup - Yahan cloudinary (v2) pass karna zaroori hai
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Yahan 'cloudinary' pass karein, 'cloudinary.v2' nahi
  params: {
    folder: "zaem_products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    format: async (req, file) => "webp", // Format auto-detect karega
  },
});

const upload = multer({ storage: storage });

// 🔴 Upload Route - Asal Error yahan print hoga
router.post("/", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("❌ Cloudinary/Multer Error:", err);
      return res.status(500).json({
        success: false,
        message: "Upload failed",
        error: err.message || "Unknown error",
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Cloudinary se aane wala URL
    res.status(200).json({ success: true, url: req.file.path });
  });
});

export default router;