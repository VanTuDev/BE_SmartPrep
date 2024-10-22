import mongoose from 'mongoose';

// Định nghĩa schema cho câu hỏi trong bài làm
const QuestionSchema = new mongoose.Schema({
   question_text: {
      type: String,
      required: [true, "Please provide the question text."]
   },
   question_type: {
      type: String,
      enum: ['multiple-choice', 'essay', 'true-false'], // Loại câu hỏi
      required: true
   },
   options: {
      type: [String], // Mảng tùy chọn cho câu hỏi
      required: [true, "Please provide the options for the question."]
   },
   correct_answers: {
      type: [String], // Mảng chứa đáp án đúng
      required: [true, "Please provide the correct answers."]
   },
   user_answer: {
      type: String, // Câu trả lời của người dùng
      default: null
   },
   submission_time: {
      type: Date, // Thời gian nộp câu trả lời
      default: Date.now
   }
});

// Định nghĩa schema cho bài làm (Submission)
const SubmissionSchema = new mongoose.Schema({
   learner: { // Tham chiếu đến người nộp bài
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Người dùng là học sinh
      required: true
   },
   test_id: { // Tham chiếu đến bài kiểm tra
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true
   },
   questions: [QuestionSchema], // Danh sách câu hỏi và câu trả lời của người dùng
   started_at: { // Thời gian bắt đầu bài kiểm tra
      type: Date,
      default: Date.now
   },
   finished_at: { // Thời gian kết thúc bài kiểm tra
      type: Date,
      default: null
   },
   score: { // Điểm số bài kiểm tra
      type: Number,
      default: 0
   },
   status: { // Trạng thái bài làm
      type: String,
      enum: ['in-progress', 'completed', 'submitted'],
      default: 'in-progress'
   }
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

// Kiểm tra model đã tồn tại hay chưa trước khi tạo mới
const SubmissionModel = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

export default SubmissionModel;
