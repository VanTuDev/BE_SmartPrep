import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Function to ensure a directory exists
const ensureDirectoryExistence = (uploadPath) => {
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
};

// Storage configuration for citizen ID photos
const storagePhotos = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/photos/';
        ensureDirectoryExistence(uploadPath); // Ensure directory exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique name with original extension
    }
});

// Storage configuration for CVs
const storageCV = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/cvs/';
        ensureDirectoryExistence(uploadPath); // Ensure directory exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images (JPG, PNG)
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new Error('Lỗi: Chỉ hỗ trợ các tệp hình ảnh (JPG/PNG)!'));
    }
};

// File filter for PDFs (CV)
const pdfFileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Lỗi: Chỉ hỗ trợ tệp PDF cho CV!'));
    }
};

// Middleware for uploading citizen ID photos (2 photos max)
export const uploadPhotos = multer({
    storage: storagePhotos,
    limits: { fileSize: 50 * 1024 * 1024 }, // 5MB limit for images
    fileFilter: imageFileFilter
});

// Middleware for uploading CV (PDF)
export const uploadCV = multer({
    storage: storageCV,
    limits: { fileSize: 50 * 1024 * 1024 }, // 5MB limit for CV
    fileFilter: pdfFileFilter
});

// Combined middleware for handling both images and CV
export const uploadFiles = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = file.fieldname === 'cv' ? 'uploads/cvs/' : 'uploads/photos/';
            ensureDirectoryExistence(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'cv') {
            pdfFileFilter(req, file, cb);
        } else if (file.fieldname === 'citizenIdPhotos') {
            imageFileFilter(req, file, cb);
        }
    }
});
