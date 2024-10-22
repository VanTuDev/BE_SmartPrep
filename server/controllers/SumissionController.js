import SubmissionModel from '../model/Submission.model.js';
import TestModel from '../model/Test.model.js';
import QuestionModel from '../model/Question.model.js';

// Bắt đầu một bài kiểm tra mới cho người dùng
// export const startTest = async (req, res) => {
//    const { _id_user, _id_test } = req.body;

//    try {
//       // Lấy thông tin bài kiểm tra từ TestModel và `populate` chi tiết câu hỏi từ `QuestionModel`
//       const test = await TestModel.findById(_id_test)
//          .populate({
//             path: 'questions.question_id',
//             model: QuestionModel,
//             select: 'question_text question_type options correct_answers', // Lấy cả `correct_answers` từ QuestionModel
//          })
//          .lean();

//       if (!test) {
//          return res.status(404).json({ message: 'Test not found' });
//       }

//       if (!test.questions || test.questions.length === 0) {
//          return res.status(400).json({ message: 'Test contains no questions' });
//       }

//       // Chuyển đổi danh sách câu hỏi từ bài kiểm tra để thêm vào submission
//       const questions = test.questions.map((question, index) => {
//          if (
//             question.question_id &&
//             question.question_id.question_text &&
//             question.question_id.question_type &&
//             Array.isArray(question.question_id.options) &&
//             question.question_id.correct_answers // Đảm bảo rằng câu hỏi có trường `correct_answers`
//          ) {
//             return {
//                question_text: question.question_id.question_text, // Lấy `question_text` từ QuestionModel
//                question_type: question.question_id.question_type, // Lấy `question_type` từ QuestionModel
//                options: question.question_id.options || [], // Lấy `options` từ QuestionModel nếu có
//                answer: '', // Đáp án mà người dùng sẽ chọn (mặc định rỗng)
//                correct_answers: question.question_id.correct_answers, // Thêm `correct_answers` từ câu hỏi
//                _id: question.question_id._id // Lưu ID của từng câu hỏi
//             };
//          } else {
//             console.error(`Question at index ${index} is invalid or missing fields:`, question);
//             return null;
//          }
//       });

//       if (questions.includes(null)) {
//          console.error('Invalid questions detected:', questions.filter((q) => q === null)); // Log các câu hỏi không hợp lệ
//          return res.status(400).json({ message: 'Test contains invalid or missing questions' });
//       }

//       // Tạo mới một Submission với danh sách câu hỏi
//       const newSubmission = new SubmissionModel({
//          _id_user,
//          _id_test,
//          questions, // Thêm danh sách câu hỏi vào Submission, bao gồm cả `correct_answers`
//          status: 'in-progress',
//          started_at: Date.now(),
//       });

//       await newSubmission.save();
//       res.status(201).json({ message: 'Test started successfully', submission: newSubmission });
//    } catch (error) {
//       console.error(`Error starting test: ${error.message}`);
//       res.status(500).json({ message: `Error starting test: ${error.message}` });
//    }
// };



// Nộp câu trả lời cho một câu hỏi
// export const submitAnswer = async (req, res) => {
//    const { submissionId } = req.params; // Lấy ID của submission
//    const { question_id, selected_answer } = req.body; // Lấy thông tin câu hỏi và đáp án từ request

//    try {
//       // Tìm kiếm submission hiện tại bằng ID
//       const submission = await SubmissionModel.findById(submissionId);
//       if (!submission) {
//          return res.status(404).json({ message: 'Submission not found' });
//       }

//       // Tìm câu hỏi trong mảng `questions` và cập nhật đáp án `answer`
//       const question = submission.questions.find((q) => q._id.toString() === question_id);
//       console.log("Question Found:", question);
//       if (!question) {
//          return res.status(404).json({ message: 'Question not found in this submission' });
//       }

//       // Cập nhật đáp án mà người dùng đã chọn vào `answer`
//       question.answer = selected_answer;

//       // Lưu lại submission đã được cập nhật
//       await submission.save();
//       res.status(200).json({ message: 'Answer submitted successfully', submission });
//    } catch (error) {
//       console.error('Error submitting answer:', error);
//       res.status(500).json({ message: `Error submitting answer: ${error.message}` });
//    }
// };

// Hoàn thành và nộp toàn bộ bài kiểm tra
export const finishTest = async (req, res) => {
   const { submissionId } = req.params;

   try {
      const submission = await SubmissionModel.findById(submissionId);
      if (!submission) {
         return res.status(404).json({ message: 'Submission not found' });
      }

      // Tính toán điểm
      let totalCorrectAnswers = 0;
      submission.questions.forEach((question) => {
         // So sánh `answer` của người dùng với `correct_answers` của câu hỏi
         if (question.answer && question.correct_answers.includes(question.answer)) {
            totalCorrectAnswers += 1;
         }
      });

      // Tính toán điểm trên thang điểm 10
      const score = (totalCorrectAnswers / submission.questions.length) * 10;

      // Cập nhật `score` và trạng thái của bài thi
      submission.score = score; // Lưu điểm vào trường `score`
      submission.status = 'submitted';
      submission.finished_at = Date.now();

      await submission.save();
      res.status(200).json({ message: `Test submitted successfully. Your score is ${score}/10.`, submission });
   } catch (error) {
      console.error(`Error submitting test: ${error.message}`);
      res.status(500).json({ message: `Error submitting test: ${error.message}` });
   }
};


// Lấy thông tin chi tiết bài làm theo ID
export const getSubmissionById = async (req, res) => {
   const { submissionId } = req.params;

   try {
      const submission = await SubmissionModel.findById(submissionId)
         .populate('_id_user', 'name')
         .populate('_id_test', 'title');
      if (!submission) {
         return res.status(404).json({ message: 'Submission not found' });
      }

      res.status(200).json(submission);
   } catch (error) {
      res.status(500).json({ message: `Error fetching submission: ${error.message}` });
   }
};

// Lấy tất cả các bài làm của một người dùng cụ thể
export const getAllSubmissionsByUser = async (req, res) => {
   const { userId } = req.params;

   try {
      const submissions = await SubmissionModel.find({ _id_user: userId }).populate('_id_test', 'title');
      res.status(200).json(submissions);
   } catch (error) {
      res.status(500).json({ message: `Error fetching submissions: ${error.message}` });
   }
};

export async function startTest(req, res) {
   try {
      const { learner, test_id } = req.body;
      const newSubmission = new SubmissionModel({
         learner,
         test_id,
         status: 'in-progress'
      });

      await newSubmission.save();
      res.status(201).json({ msg: "Bắt đầu bài kiểm tra!", submission: newSubmission });
   } catch (error) {
      res.status(500).json({ error: "Lỗi khi bắt đầu bài kiểm tra!" });
   }
}

export async function submitAnswer(req, res) {
   try {
      const { submissionId, question_id, selected_answer } = req.body;
      const submission = await SubmissionModel.findById(submissionId);

      const question = submission.questions.find(q => q._id.toString() === question_id);
      if (!question) return res.status(404).json({ error: "Câu hỏi không tồn tại!" });

      question.user_answer = selected_answer;
      await submission.save();
      res.status(200).json({ msg: "Nộp câu trả lời thành công!", submission });
   } catch (error) {
      res.status(500).json({ error: "Lỗi khi nộp câu trả lời!" });
   }
}