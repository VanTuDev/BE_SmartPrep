import mongoose from 'mongoose';

// Định nghĩa schema cho bài kiểm tra
const TestSchema = new mongoose.Schema({
   title: {
      type: String,
      required: [true, "Please provide the title of the test"],
   },
   description: {
      type: String,
      required: [true, "Please provide a description for the test"],
   },
   instructor: { // Tham chiếu đến giáo viên tạo bài kiểm tra
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   questions: [{ // Tham chiếu đến danh sách câu hỏi trong bài kiểm tra
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
   }],
   classRoom_id: { // Tham chiếu đến lớp học liên quan
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassRoom',
      required: false, // Không bắt buộc vì có thể có hoặc không
   },
   duration: {
      type: Number,
      required: [true, "Please provide the duration of the test in minutes"],
   },
   access_type: {
      type: String,
      enum: ['public', 'private'], // Chế độ truy cập
      default: 'public',
   },
   start_date: {
      type: Date,
      required: true, // Ngày bắt đầu
   },
   end_date: {
      type: Date,
      required: true, // Ngày kết thúc
   },
   invite_users: { // Danh sách email người dùng được mời làm bài kiểm tra
      type: [String],
      default: [],
   },
   access_link: { // Đường dẫn truy cập bài kiểm tra
      type: String,
      required: true,
   },
   status: {
      type: String,
      enum: ['published', 'draft'], // Trạng thái bài kiểm tra
      default: 'draft',
   },
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

// Kiểm tra xem model đã tồn tại hay chưa
const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);

export default TestModel;
