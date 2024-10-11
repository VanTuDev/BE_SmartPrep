import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
   question_text: {
      type: String,
      required: true
   },
   question_type: {
      type: String,
      required: false
   }, // Sử dụng số để định danh kiểu câu hỏi (ví dụ: 0: multiple-choice, 1: essay)
   options: {
      type: [String],
      require: true,
   },
   correct_answers: {
      type: [String], // Đảm bảo đúng định dạng là mảng chuỗi
      required: true,
   },
   answer: {
      type: String
   },
   submission_time: {
      type: Date,
      default: Date.now
   },
});

const submissionSchema = new mongoose.Schema({
   _id_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   _id_test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true
   },
   questions: [questionSchema],
   started_at: {
      type: Date,
      default: Date.now
   },
   finished_at: {
      type: Date
   },
   score: {
      type: Number, // Thêm trường `score` để lưu điểm
      default: 0,
   },
   status: {
      type: String,
      enum: ['in-progress', 'completed', 'submitted'],
      default: 'in-progress'
   },
}, { timestamps: true });

const SubmissionModel = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

export default SubmissionModel;
