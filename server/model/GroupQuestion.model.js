import mongoose from 'mongoose'; // Nhập thư viện Mongoose để tương tác với MongoDB

// Định nghĩa schema cho nhóm câu hỏi
const GroupQuestionSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, "Vui lòng cung cấp tên nhóm bài kiểm tra"],
      unique: true, // Đảm bảo rằng tên nhóm là duy nhất
      trim: true, // Loại bỏ khoảng trắng ở đầu và cuối
   },
   description: {
      type: String,
      required: [true, "Vui lòng cung cấp mô tả cho nhóm bài kiểm tra"],
      trim: true, // Loại bỏ khoảng trắng ở đầu và cuối
   },
   created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Tham chiếu đến model User để biết ai đã tạo nhóm
      required: true,
   },
}, {
   timestamps: true, // Tự động thêm trường createdAt và updatedAt
});

// Kiểm tra xem model đã tồn tại hay chưa
const GroupQuestionModel = mongoose.models.GroupQuestion || mongoose.model('GroupQuestion', GroupQuestionSchema);

export default GroupQuestionModel; // Xuất mô hình
