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
      cb(null, uploadPath); // Lưu file vào thư mục 'uploads'
   },
   filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname)); // Đặt tên tệp với timestamp và giữ nguyên phần mở rộng
   }
});

// Bộ lọc file hợp lệ cho ảnh JPEG, PNG và PDF
const fileFilter = (req, file, cb) => {
   const allowedTypes = /jpeg|jpg|png|pdf/;
   const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
   const mimeType = allowedTypes.test(file.mimetype);

   if (extName && mimeType) {
      cb(null, true); // File hợp lệ
   } else {
      cb(new Error('Lỗi: Chỉ hỗ trợ các tệp JPEG, PNG và PDF!')); // Thông báo lỗi rõ ràng
   }
};

// Bộ lọc file cho Excel (.xlsx, .xls)
const excelFilter = (req, file, cb) => {
   console.log('Tên tệp:', file.originalname);
   console.log('MIME type:', file.mimetype);
   console.log('Đường dẫn phần mở rộng:', path.extname(file.originalname).toLowerCase());

   const allowedTypes = /xlsx|xls/;
   const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

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
      const errorMessage = 'Lỗi: Chỉ hỗ trợ các tệp Excel (.xlsx, .xls)!';
      console.error(errorMessage);
      cb(new Error(errorMessage)); // Trả về lỗi
   }
};

// Middleware upload cho ảnh và PDF (5MB giới hạn)
export const uploadImage = multer({
   storage: storage,
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB giới hạn cho ảnh/PDF
   fileFilter: fileFilter
});

// Middleware upload cho file Excel (5MB giới hạn)
export const uploadExcel = multer({
   storage: storage,
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB giới hạn cho Excel
   fileFilter: excelFilter
});
