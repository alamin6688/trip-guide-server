import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { v2 as cloudinary } from "cloudinary";
import config from "../../config";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

const uploadToCloudinary = async (file: Express.Multer.File) => {
  console.log("file", file);

  // Configuration
  cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
  });

  // Upload an image
  try {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      public_id: file.filename,
    });

    // Delete file after upload
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });

    return uploadResult;
  } catch (error) {
    console.log(error);
    // Attempt to delete file even if upload fails
    fs.unlink(file.path, (err) => {
      if (err) console.error("Error deleting file after failed upload:", err);
    });
  }
};

export const fileUploader = {
  upload,
  uploadToCloudinary,
};
