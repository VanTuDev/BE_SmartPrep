import SubmissionModel from '../model/Submission.model.js';
import TestModel from '../model/Test.model.js';
import QuestionModel from '../model/Question.model.js';
import logger from '../utils/logger.js'; // Sử dụng Winston logger


// Bắt đầu một bài kiểm tra mới cho người dùng
export const startTest = async (req, res) => {
   try {
      const { learner, test_id } = req.body;

      const test = await TestModel.findById(test_id).populate('questions_id').lean();

      if (!test) {
         logger.warn(`Không tìm thấy bài kiểm tra với ID: ${test_id}`);
         return res.status(404).json({ error: 'Test not found!' });
      }

      const questions = test.questions_id.map(q => ({
         question_id: q._id,
         user_answer: [], // Để trống cho người dùng trả lời
         is_correct: false,
         submission_time: Date.now(),
      }));

      const newSubmission = new SubmissionModel({
         learner,
         test_id,
         questions,
         status: 'in-progress',
         started_at: Date.now(),
      });

      await newSubmission.save();
      logger.info(`Bài kiểm tra đã được bắt đầu cho người dùng: ${learner}`);
      res.status(201).json({ msg: 'Bài kiểm tra đã được bắt đầu!', submission: newSubmission });
   } catch (error) {
      logger.error('Lỗi khi bắt đầu bài kiểm tra:', error);
      res.status(500).json({ error: `Lỗi khi bắt đầu bài kiểm tra: ${error.message}` });
   }
};

// Nộp câu trả lời cho câu hỏi
export async function submitAnswer(req, res) {
   try {
      const { submissionId, question_id, selected_answer } = req.body;

      logger.info(`Nộp câu trả lời cho submission: ${submissionId}, question: ${question_id}`);

      // Tìm submission hiện tại
      const submission = await SubmissionModel.findById(submissionId);
      if (!submission) {
         logger.warn(`Không tìm thấy submission với ID: ${submissionId}`);
         return res.status(404).json({ error: 'Submission not found!' });
      }

      // Lấy câu hỏi liên quan từ QuestionModel
      const question = await QuestionModel.findById(question_id).lean();
      if (!question) {
         logger.warn(`Không tìm thấy câu hỏi với ID: ${question_id}`);
         return res.status(404).json({ error: 'Question not found!' });
      }

      // Log câu hỏi và các tùy chọn ra cho kiểm tra
      logger.info(`Câu hỏi: ${question.question_text}`);
      logger.info(`Các tùy chọn: ${question.options.join(', ')}`);
      logger.info(`Đáp án đúng: ${question.correct_answers.join(', ')}`);

      // Kiểm tra xem câu trả lời có đúng không
      const isCorrect = question.correct_answers.includes(selected_answer);

      // Cập nhật câu trả lời trong submission
      const questionInSubmission = submission.questions.find(q => q.question_id.toString() === question_id);
      if (!questionInSubmission) {
         logger.warn(`Câu hỏi không tồn tại trong submission: ${question_id}`);
         return res.status(404).json({ error: 'Question not found in submission!' });
      }

      // Gán câu trả lời và kết quả đúng/sai
      questionInSubmission.user_answer = selected_answer;
      questionInSubmission.is_correct = isCorrect;

      await submission.save();
      logger.info(`Câu trả lời: ${selected_answer}, Kết quả: ${isCorrect ? 'Đúng' : 'Sai'}`);

      res.status(200).json({
         msg: 'Nộp câu trả lời thành công!',
         question: question.question_text,
         options: question.options,
         correct_answers: question.correct_answers,
         selected_answer,
         is_correct: isCorrect
      });
   } catch (error) {
      logger.error('Lỗi khi nộp câu trả lời:', error);
      res.status(500).json({ error: `Lỗi khi nộp câu trả lời: ${error.message}` });
   }
}


// Hoàn thành và nộp toàn bộ bài kiểm tra
export const finishTest = async (req, res) => {
   try {
      const { submissionId } = req.params;
      logger.info(`Hoàn thành bài kiểm tra với submission ID: ${submissionId}`);

      const submission = await SubmissionModel.findById(submissionId);
      if (!submission) {
         logger.warn(`Không tìm thấy submission với ID: ${submissionId}`);
         return res.status(404).json({ message: 'Submission not found' });
      }

      let totalCorrectAnswers = 0;
      submission.questions.forEach(question => {
         if (question.is_correct) {
            totalCorrectAnswers += 1;
         }
      });

      const score = (totalCorrectAnswers / submission.questions.length) * 10;
      submission.score = score;
      submission.status = 'submitted';
      submission.finished_at = Date.now();

      await submission.save();
      logger.info(`Bài kiểm tra đã được nộp với ID: ${submissionId}, điểm: ${score}`);
      res.status(200).json({ msg: `Bài kiểm tra đã nộp thành công. Điểm của bạn là ${score}/10.`, submission });
   } catch (error) {
      logger.error("Error submitting test:", error);
      res.status(500).json({ message: `Error submitting test: ${error.message}` });
   }
};

// Lấy thông tin bài làm theo ID
export const getSubmissionById = async (req, res) => {
   try {
      const { submissionId } = req.params;

      // Tìm submission và populate câu hỏi từ QuestionModel
      const submission = await SubmissionModel.findById(submissionId)
         .populate('questions.question_id', 'question_text correct_answers')
         .populate('learner', 'name')
         .populate('test_id', 'title');

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
   try {
      const { userId } = req.params;
      logger.info(`Lấy tất cả bài làm của người dùng với ID: ${userId}`);

      const submissions = await SubmissionModel.find({ learner: userId }).populate('test_id', 'title');
      res.status(200).json(submissions);
   } catch (error) {
      logger.error("Error fetching submissions:", error);
      res.status(500).json({ message: `Error fetching submissions: ${error.message}` });
   }
};
