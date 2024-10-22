import mongoose from 'mongoose';

// Định nghĩa schema cho bài kiểm tra
const TestSchema = new mongoose.Schema({
   // tên bài kiểm tra
   title: {
      type: String,
      required: [true, "Please provide the title of the test"],
   },
   // Nội dung chi tiết nói về bào kiểm tra
   description: {
      type: String,
      required: [false, "Please provide a description for the test"], // không bắt buộc
   },
   // tham chiếu đến id test
   instructor: { // Tham chiếu đến giáo viên tạo bài kiểm tra
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   grade_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: false
   },
   category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false
   },
   group_id: { // Tham chiếu đến chương học
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupQuestion',
      default: false
   },
   // thay đổi question -> question_id
   questions_id: [{ // Tham chiếu đến danh sách câu hỏi trong bài kiểm tra
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
   }],
   // Bài kiểm tra được add trong lớp
   classRoom_id: { // Tham chiếu đến lớp học liên quan
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassRoom',
      required: false, // Không bắt buộc vì có thể có hoặc không
   },
   // thời gian làm bài
   duration: {
      type: Number,
      required: [true, "Vui lòng nhập thời gian làm bài"],
   },


   // THời gian của bài kiểm tra
   start_date: {
      type: Date,
      required: true, // thời gian Ngày bắt đầu
   },

   end_date: {
      type: Date,
      required: true, // thời gian Ngày kết thúc
   },

   access_link: { // Đường dẫn truy cập bài kiểm tra - có thể gửi vào trong box chat của lớp
      type: String,
      required: false,
   },

   status: {
      type: String,
      enum: ['published', 'draft', 'start', 'end'], // Trạng thái bài kiểm tra đã đăng, đang soạn, đang diễn ra, đã kết thúc
      default: 'draft',
   },



}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

// Kiểm tra xem model đã tồn tại hay chưa
const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);

export default TestModel;
