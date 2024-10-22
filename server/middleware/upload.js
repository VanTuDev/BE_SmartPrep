// middleware/upload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Cấu hình lưu trữ
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      const uploadPath = 'uploads/';
      if (!fs.existsSync(uploadPath)) {
         fs.mkdirSync(uploadPath); // Tạo thư mục nếu chưa tồn tại
      }
      cb(null, uploadPath);
   },
   filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
   }
});

// Bộ lọc file cho ảnh (JPEG và PNG)
const imageFilter = (req, file, cb) => {
   const allowedTypes = /jpeg|jpg|png/;
   const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
   const mimeType = allowedTypes.test(file.mimetype);

   if (extName && mimeType) {
      cb(null, true); // Định dạng ảnh hợp lệ
   } else {
      cb(new Error('Lỗi: Chỉ hỗ trợ định dạng ảnh JPEG và PNG!')); // Lỗi nếu không hợp lệ
   }
};

// Bộ lọc file cho Excel (.xlsx, .xls)
const excelFilter = (req, file, cb) => {
   console.log('Tên tệp:', file.originalname);
   console.log('MIME type:', file.mimetype);
   console.log('Đường dẫn phần mở rộng:', path.extname(file.originalname).toLowerCase());

   const allowedTypes = /xlsx|xls/; // Kiểm tra phần mở rộng tệp
   const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

   // MIME types phổ biến cho Excel
   const mimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
   ];
   const mimeType = mimeTypes.includes(file.mimetype);

   console.log('Kiểm tra extName:', extName);
   console.log('Kiểm tra mimeType:', mimeType);

   if (extName && mimeType) {
      cb(null, true); // File hợp lệ
   } else {
      const errorMessage = `Lỗi: Tệp không hợp lệ! Chỉ hỗ trợ các tệp Excel (.xlsx, .xls)`;
      console.error(errorMessage);
      cb(new Error(errorMessage)); // Trả về lỗi
   }
};


// Middleware upload cho ảnh (sử dụng imageFilter)
export const uploadImage = multer({
   storage: storage,
   limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB cho ảnh
   fileFilter: imageFilter
});

// Middleware upload cho file Excel
export const uploadExcel = multer({
   storage: storage,
   limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước 5MB
   fileFilter: excelFilter
});
