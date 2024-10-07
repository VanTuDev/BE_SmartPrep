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
   user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Tham chiếu đến model User để biết ai đã tạo bài kiểm tra
      required: true,
   },
   questions: [
      {
         question_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question', // Tham chiếu đến model Question
            required: true,
         }
      },
   ],
   duration: {
      type: Number,
      required: [true, "Please provide the duration of the test in minutes"], // thời gian làm bài kiểm tra
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
   invite_users: {
      type: [String], // Danh sách email người dùng được mời làm bài
      default: [],
   },
   access_link: {
      type: String, // Đường dẫn đến bài kiểm tra
      required: true,
   },
   status: {
      type: String,
      enum: ['published', 'draft'], // Trạng thái của bài kiểm tra
      default: 'draft',
   },
}, {
   timestamps: true, // Tự động thêm createdAt và updatedAt
});

// Kiểm tra xem model đã tồn tại hay chưa
const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);

export default TestModel;
