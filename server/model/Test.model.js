import mongoose from 'mongoose';

// Định nghĩa schema cho bài kiểm tra
const TestSchema = new mongoose.Schema({
   title: {
      type: String,
      required: [true, "Please provide the title of the test"],
   },
   description: {
      type: String,
      required: [false, "Please provide a description for the test"],
   },
   instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   grade_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: null
   },
   category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: null
   },
   group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupQuestion',
      default: null
   },
   questions_id: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
   }],
   classRoom_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassRoom',
      required: false,
   }],
   duration: {
      type: Number,
      required: [true, "Vui lòng nhập thời gian làm bài"],
   },
   start_date: {
      type: Date,
      required: true, 
   },
   end_date: {
      type: Date,
      required: true,
   },
   access_link: {
      type: String,
      required: false,
   },
   status: {
      type: String,
      enum: ['published', 'draft', 'start', 'end'],
      default: 'draft',
   },
   submission_ids: [{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
   }],
}, { timestamps: true });

const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);

export default TestModel;
