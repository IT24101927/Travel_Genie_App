const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary only if credentials exist
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const createStorage = (folder = 'general') => {
  // Use Cloudinary for production/hosting, Disk for local development
  if (isCloudinaryConfigured) {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: `travelgenie/${folder}`,
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
      }
    });
  }

  // Fallback to Local Disk Storage
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', folder);
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
      cb(null, safeName);
    }
  });
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const createUploader = (folder) => {
  return multer({
    storage: createStorage(folder),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  });
};

module.exports = {
  createUploader
};
