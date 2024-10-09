import mongoose from 'mongoose';

// Định nghĩa schema cho danh mục
const CategorySchema = new mongoose.Schema({
   name: {
      type: String, // Kiểu dữ liệu của trường là chuỗi
      required: [true, "Please provide the category name"], // Trường là bắt buộc với thông báo lỗi nếu không có
   },
   description: {
      type: String, // Kiểu dữ liệu của trường là chuỗi
      required: [true, "Please provide a description for the category"], // Trường là bắt buộc với thông báo lỗi nếu không có
   },
   created_by: {
      type: mongoose.Schema.Types.ObjectId, // Kiểu dữ liệu là ObjectId
      ref: 'User', // Tham chiếu tới model User để xác định ai đã tạo danh mục
      required: true, // Trường là bắt buộc
   },
}, {
   timestamps: true, // Tự động thêm các trường createdAt và updatedAt
});

// Kiểm tra xem model đã tồn tại hay chưa
const CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// Xuất model
export default CategoryModel;
