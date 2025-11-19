// multer:	Handles file uploads in Express
// path:	Helps us work with file and folder paths
// fs:	(File System) Lets us create or check folders/files in our project

import multer from 'multer';
import path from 'path'; //built-in Node.js module.
import fs from 'fs'; //built-in Node.js module.

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
// check if that folder exists. otherwise create it .
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const createSubDir = (subDir) => {
  const fullPath = path.join(uploadsDir, subDir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};
// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    // Organize files by type
    if (file.fieldname === 'image') {
      uploadPath = createSubDir(`/images`);
    } else if (file.fieldname === 'document') {
      uploadPath = createSubDir(`/documents`);
    }
    else if (file.fieldname === 'logo_url') {
      uploadPath = createSubDir(`/logo`);
    } else {
      uploadPath = createSubDir(`/others`);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp + random number + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocumentTypes = /pdf|doc|docx|txt|ppt|pptx/;

  const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) ||
    allowedDocumentTypes.test(path.extname(file.originalname).toLowerCase());

  const mimetype = file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('application/') ||
    file.mimetype === 'text/plain';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed!'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Export different upload configurations
export const uploadSingle = upload.single('image');
export const uploadLogo = upload.single('logo_url');
export const uploadMultiple = upload.array('files', 5); // Max 5 files
export const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]);

export default upload; 