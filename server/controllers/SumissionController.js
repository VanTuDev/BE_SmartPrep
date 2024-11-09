import SubmissionModel from '../model/Submission.model.js';
import TestModel from '../model/Test.model.js';
import QuestionModel from '../model/Question.model.js';
import logger from '../utils/logger.js'; // Winston Logger

// Bắt đầu một bài kiểm tra mới cho người dùng
export const startTest = async (req, res) => {
   try {
      const { learner, test_id } = req.body;

      // Lấy thông tin bài kiểm tra và populate câu hỏi
      const test = await TestModel.findById(test_id).populate('questions_id').lean();

      if (!test) {
         logger.warn(`Không tìm thấy bài kiểm tra với ID: ${test_id}`);
         return res.status(404).json({ error: 'Test not found!' });
      }

      // Khởi tạo các câu hỏi với trạng thái mặc định cho submission
      const questions = test.questions_id.map(q => ({
         question_id: q._id,
         user_answer: [], // Để trống cho người dùng trả lời
         is_correct: false,
         submission_time: Date.now()
      }));

      // Tạo mới một submission
      const newSubmission = new SubmissionModel({
         learner,
         test_id,
         questions,
         duration: test.duration,
         status: 'in-progress',
         started_at: Date.now(),
      });

      await newSubmission.save();

      // Thêm submission_id vào submission_ids của Test
      await TestModel.findByIdAndUpdate(
         test_id,
         { $push: { submission_ids: newSubmission._id } }
      );

      logger.info(`Bài kiểm tra đã được bắt đầu cho người dùng: ${learner}`);
      res.status(201).json({ msg: 'Bài kiểm tra đã được bắt đầu!', submission: newSubmission });
   } catch (error) {
      logger.error('Lỗi khi bắt đầu bài kiểm tra:', error);
      res.status(500).json({ error: `Lỗi khi bắt đầu bài kiểm tra: ${error.message}` });
   }
};

// Nộp câu trả lời cho câu hỏi
export const submitAnswer = async (req, res) => {
   const { submissionId } = req.params;
   const { question_id, selected_answer } = req.body;

   try {
      // Tìm submission
      const submission = await SubmissionModel.findById(submissionId);
      if (!submission) {
         logger.warn(`Không tìm thấy submission với ID: ${submissionId}`);
         return res.status(404).json({ error: 'Submission not found!' });
      }

      // Tìm câu hỏi trong submission
      const questionInSubmission = submission.questions.find(q => q.question_id.toString() === question_id);
      if (!questionInSubmission) {
         logger.warn(`Câu hỏi không tồn tại trong submission: ${question_id}`);
         return res.status(404).json({ error: 'Question not found in submission!' });
      }

      // Lấy thông tin câu hỏi từ DB
      const question = await QuestionModel.findById(question_id).lean();
      if (!question) {
         logger.warn(`Không tìm thấy câu hỏi với ID: ${question_id}`);
         return res.status(404).json({ error: 'Question not found!' });
      }

      // Kiểm tra xem đáp án có đúng không
      const isCorrect = question.correct_answers.includes(selected_answer);

      // Cập nhật thông tin câu trả lời trong submission
      questionInSubmission.user_answer = selected_answer;
      questionInSubmission.is_correct = isCorrect;

      await submission.save();
      logger.info(`Câu trả lời: ${selected_answer}, Kết quả: ${isCorrect ? 'Đúng' : 'Sai'}`);

      res.status(200).json({
         msg: 'Nộp câu trả lời thành công!',
         question: question.question_text,
         selected_answer,
         is_correct: isCorrect
      });
   } catch (error) {
      logger.error('Lỗi khi nộp câu trả lời:', error);
      res.status(500).json({ error: `Lỗi khi nộp câu trả lời: ${error.message}` });
   }
};

// Hoàn thành và nộp bài kiểm tra
export const finishTest = async (req, res) => {
   const { submissionId } = req.params;

   try {
      const submission = await SubmissionModel.findById(submissionId);
      if (!submission) {
         logger.warn(`Không tìm thấy submission với ID: ${submissionId}`);
         return res.status(404).json({ message: 'Submission not found' });
      }

      // Tính toán điểm
      const totalCorrectAnswers = submission.questions.filter(q => q.is_correct).length;
      const score = (totalCorrectAnswers / submission.questions.length) * 10;

      // Cập nhật thông tin submission
      submission.score = score;
      submission.status = 'submitted';
      submission.finished_at = Date.now();

      await submission.save();
      logger.info(`Bài kiểm tra đã được nộp với ID: ${submissionId}, điểm: ${score}`);

      res.status(200).json({
         msg: `Bài kiểm tra đã nộp thành công. Điểm của bạn là ${score}/10.`,
         submission
      });
   } catch (error) {
      logger.error('Lỗi khi nộp bài kiểm tra:', error);
      res.status(500).json({ error: `Lỗi khi nộp bài kiểm tra: ${error.message}` });
   }
};

// Lấy thông tin submission theo ID
export const getSubmissionById = async (req, res) => {
   const { submissionId } = req.params;

   try {
      const submission = await SubmissionModel.findById(submissionId)
         .populate('learner', 'name')  // Lấy thông tin người dùng
         .populate('test_id', 'title') // Lấy thông tin bài kiểm tra
         .populate({
            path: 'questions.question_id',  // Populate chi tiết câu hỏi
            model: 'Question',  // Tham chiếu đến model `Question`
            select: 'question_text options correct_answers', // Chỉ lấy các trường cần thiết
         });

      if (!submission) {
         logger.warn(`Không tìm thấy submission với ID: ${submissionId}`);
         return res.status(404).json({ error: 'Submission not found!' });
      }

      res.status(200).json(submission);
   } catch (error) {
      logger.error('Lỗi khi lấy submission:', error);
      res.status(500).json({ error: 'Lỗi khi lấy submission!' });
   }
};

// Lấy tất cả các bài làm của người dùng
export const getAllSubmissionsByUser = async (req, res) => {
   const { userId } = req.params;

   try {
      const submissions = await SubmissionModel.find({ learner: userId }).populate('test_id', 'title');
      res.status(200).json(submissions);
   } catch (error) {
      logger.error('Lỗi khi lấy bài làm:', error);
      res.status(500).json({ error: 'Lỗi khi lấy bài làm!' });
   }
};
