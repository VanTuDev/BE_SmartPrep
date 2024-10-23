import mongoose from 'mongoose';

// Định nghĩa schema cho câu hỏi trong bài làm (trong Submission)
const QuestionInSubmissionSchema = new mongoose.Schema({
   question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
   },
   user_answer: {
      type: [String], // Hỗ trợ nhiều đáp án
      default: [],
   },
   is_correct: {
      type: Boolean, // Trạng thái đúng/sai
      default: false,
   },
   submission_time: {
      type: Date, // Thời gian trả lời
      default: Date.now,
   },
}, { _id: false }); // Không cần ID riêng cho từng câu hỏi trong submission

// Định nghĩa schema cho bài làm (Submission)
const SubmissionSchema = new mongoose.Schema({
   learner: { // Tham chiếu đến người dùng (học sinh)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   test_id: { // Tham chiếu đến bài kiểm tra
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
   },
   questions: [QuestionInSubmissionSchema], // Danh sách câu hỏi và câu trả lời
   started_at: { // Thời gian bắt đầu bài kiểm tra
      type: Date,
      default: Date.now,
   },
   finished_at: { // Thời gian kết thúc bài kiểm tra
      type: Date,
      default: null,
   },
   score: { // Điểm số
      type: Number,
      default: 0,
   },
   status: { // Trạng thái của bài làm
      type: String,
      enum: ['in-progress', 'completed', 'submitted'],
      default: 'in-progress',
   },
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

// Kiểm tra model đã tồn tại chưa trước khi tạo mới
const SubmissionModel = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

export default SubmissionModel;
