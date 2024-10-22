// NGÂN HÀNG CÂU HỎI

import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
   category_id: { // Tham chiếu đến danh mục môn học
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
   },
   group_id: { // Tham chiếu đến chương học
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupQuestion',
      default: null
   },
   grade_id: { // Tham chiếu đến khối học
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      default: null
   },
   classRoom_id: [{ // Tham chiếu đến lớp học
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassRoom',
      default: null
   }],
   test_id: { // Tham chiếu đến bài kiểm tra
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      default: null
   },
   question_text: { type: String, required: true },
   question_type: { type: String, enum: ['essay', 'multiple-choice', 'choice'], required: true },
   options: { type: [String], required: true },
   correct_answers: { type: [String], required: true },
   instructor: { // Tham chiếu đến giáo viên tạo câu hỏi
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   }
}, { timestamps: true });

const QuestionModel = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
export default QuestionModel;
