// middleware/upload.js
import multer from 'multer';
import path from 'path';

// Cấu hình thư mục lưu trữ file và đặt tên file
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Lưu ảnh vào thư mục 'uploads'
   },
   filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Đặt tên tệp theo timestamp
      cb(null, uniqueSuffix + path.extname(file.originalname)); // Lưu với định dạng gốc
   }
});

// Kiểm tra loại file hợp lệ (chỉ hỗ trợ ảnh JPEG và PNG)
const fileFilter = (req, file, cb) => {
   const allowedTypes = /jpeg|jpg|png/;
   const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
   const mimeType = allowedTypes.test(file.mimetype);

   if (extName && mimeType) {
      return cb(null, true); // Định dạng file hợp lệ
   } else {
      cb('Lỗi: Chỉ hỗ trợ định dạng ảnh JPEG và PNG!'); // Trả về lỗi nếu định dạng không hợp lệ
   }
};

// Khởi tạo middleware upload với các tùy chọn
const upload = multer({
   storage: storage,
   limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn kích thước 5MB
   fileFilter: fileFilter
});

export default upload;
