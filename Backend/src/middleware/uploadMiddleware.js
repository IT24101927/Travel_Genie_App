const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder = 'general') => {
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
