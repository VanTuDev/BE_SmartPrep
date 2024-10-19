import multer from 'multer';
import path from 'path';

// Cấu hình thư mục lưu trữ file và đặt tên file
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Lưu file vào thư mục 'uploads'
   },
   filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9); // Đặt tên tệp theo timestamp
      cb(null, uniqueSuffix + path.extname(file.originalname)); // Giữ nguyên định dạng gốc
   }
});

// Bộ lọc file hợp lệ (chỉ cho phép ảnh JPEG/PNG và file PDF)
const fileFilter = (req, file, cb) => {
   const allowedTypes = /jpeg|jpg|png|pdf/;
   const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
   const mimeType = allowedTypes.test(file.mimetype);

   if (extName && mimeType) {
      cb(null, true); // Định dạng hợp lệ
   } else {
      cb(new Error('Chỉ chấp nhận file JPEG, PNG hoặc PDF')); // Thông báo lỗi rõ ràng
   }
};

// Khởi tạo middleware upload
const upload = multer({
   storage: storage,
   limits: { fileSize: 1024 * 1024 * 20 }, // Giới hạn kích thước 20MB
   fileFilter: fileFilter
});

export default upload;
