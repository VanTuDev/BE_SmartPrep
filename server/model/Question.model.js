import mongoose from 'mongoose';

// Định nghĩa Schema cho câu hỏi
const QuestionSchema = new mongoose.Schema({
   category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
   },
   group: {
      type: String,
      default: 'null',
   },
   question_text: {
      type: String,
      required: [true, "Please provide the question text"],
   },
   question_type: {
      type: String,
      enum: ['essay', 'multiple-choice', 'choice'],
      required: [true, "Please specify the question type"],
   },
   option: {
      type: [String],
      required: [true, "Please provide the options for the question"],
   },
   correct_answers: {
      type: [String],
      required: [true, "Please specify the correct answers"],
   },
   created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   created_at: {
      type: Date,
      default: Date.now,
   },
   updated_at: {
      type: Date,
      default: Date.now,
   },
});

// Middleware để cập nhật thời gian
QuestionSchema.pre('save', function (next) {
   this.updated_at = Date.now();
   next();
});

QuestionSchema.pre('findOneAndUpdate', function (next) {
   this._update.updated_at = Date.now();
   next();
});

// Kiểm tra model đã tồn tại hay chưa
const QuestionModel = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

export default QuestionModel;
