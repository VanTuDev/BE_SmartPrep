import mongoose from 'mongoose';

const QuestionInSubmissionSchema = new mongoose.Schema({
   question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
   },
   user_answer: {
      type: [String],
      default: [],
   },
   is_correct: {
      type: Boolean,
      default: false,
   },
   submission_time: {
      type: Date,
      default: Date.now,
   },
}, { _id: false });

const SubmissionSchema = new mongoose.Schema({
   learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   test_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
   },
   class_id: {  // Reference to the class this submission belongs to
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassRoom',
      required: false,
   },
   questions: [QuestionInSubmissionSchema],
   started_at: {
      type: Date,
      default: Date.now,
   },
   finished_at: {
      type: Date,
      default: null,
   },
   duration: {
      type: Number,
      required: true,
   },
   score: {
      type: Number,
      default: 0,
   },
   status: {
      type: String,
      enum: ['in-progress', 'completed', 'submitted'],
      default: 'in-progress',
   },
}, { timestamps: true });

const SubmissionModel = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

export default SubmissionModel;
