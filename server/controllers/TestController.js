import mongoose from 'mongoose';
import TestModel from '../model/Test.model.js';
import QuestionModel from '../model/Question.model.js';
import SubmissionModel from '../model/Submission.model.js';
import logger from '../utils/logger.js';

// Middleware kiểm tra quyền Instructor
export function verifyInstructorRole(req, res, next) {
   try {
      const { role } = req.user;
      logger.info(`Xác thực quyền Instructor cho người dùng: ${role}`);
      if (role !== 'instructor') {
         logger.warn(`Người dùng không có quyền Instructor. Role: ${role}`);
         return res.status(403).json({ error: 'Chỉ có Instructor mới có quyền này!' });
      }
      next();
   } catch (error) {
      logger.error('Lỗi khi xác thực quyền Instructor:', error);
      res.status(500).json({ error: 'Lỗi khi xác thực quyền Instructor!' });
   }
}

export async function createTest(req, res) {
   try {
      logger.info('Nhận yêu cầu tạo bài kiểm tra...', { body: req.body, user: req.user });

      const instructorId = req.user.userId || req.user._id;

      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
         logger.error('ID instructor không hợp lệ.', { instructorId });
         return res.status(400).json({ error: 'Instructor không hợp lệ!' });
      }

      const {
         title,
         description,
         duration,
         start_date,
         end_date,
         status,
         questions,
         grade_id,
         category_id,
         group_id,
         classRoom_id
      } = req.body;

      if (!title || !duration || !start_date || !end_date || !questions) {
         logger.warn('Thiếu thông tin bắt buộc.', { body: req.body });
         return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
      }

      // Chuẩn bị testData để truyền vào hàm tạo câu hỏi
      const testData = {
         grade_id,
         category_id,
         group_id,
         classRoom_id: classRoom_id || null,
         instructor: mongoose.Types.ObjectId(instructorId) // Gán instructor
      };

      const questionIds = await getExistingOrAddQuestions(questions, testData); // Gọi hàm xử lý câu hỏi

      const newTest = new TestModel({
         title,
         description,
         questions_id: questionIds,
         duration,
         start_date,
         end_date,
         status: status || 'draft',
         grade_id,
         category_id,
         group_id,
         classRoom_id: classRoom_id || null,
         instructor: mongoose.Types.ObjectId(instructorId)
      });

      await newTest.save();
      logger.info('Bài kiểm tra đã được tạo thành công!', { testId: newTest._id });

      res.status(201).json({ msg: 'Tạo bài kiểm tra thành công!', test: newTest });
   } catch (error) {
      logger.error('Lỗi khi tạo bài kiểm tra:', { message: error.message, stack: error.stack });
      res.status(500).json({ error: `Không thể tạo bài kiểm tra: ${error.message}` });
   }
}

// Hàm kiểm tra và thêm câu hỏi vào DB nếu chưa tồn tại
async function getExistingOrAddQuestions(questions, testData) {
   const questionIds = [];
   logger.info('Dữ liệu bài kiểm tra được truyền vào:', testData);

   try {
      for (const question of questions) {
         // Tìm kiếm câu hỏi đã tồn tại trong DB
         let existingQuestion = await QuestionModel.findOne({
            question_text: question.question_text,
            question_type: question.question_type
         });

         if (existingQuestion) {
            logger.info('Câu hỏi đã tồn tại:', { questionId: existingQuestion._id });
            questionIds.push(existingQuestion._id); // Thêm ID câu hỏi đã tồn tại
         } else {
            // Nếu câu hỏi chưa tồn tại, tạo mới và gán thông tin từ bài kiểm tra
            const newQuestion = new QuestionModel({
               question_text: question.question_text,
               question_type: question.question_type,
               options: question.options,
               correct_answers: question.correct_answers,
               grade_id: testData.grade_id || null, // Lấy từ testData
               category_id: testData.category_id || null, // Lấy từ testData
               group_id: testData.group_id || null, // Lấy từ testData
               classRoom_id: testData.classRoom_id || [], // Lấy từ testData hoặc khởi tạo mảng trống
               instructor: testData.instructor, // Lấy instructor từ testData
            });

            // Lưu vào DB và log lại nếu thành công
            const savedQuestion = await newQuestion.save();
            logger.info('Câu hỏi mới được thêm:', { questionId: savedQuestion._id });
            questionIds.push(savedQuestion._id); // Thêm ID của câu hỏi mới
         }
      }

      logger.info('Danh sách câu hỏi ID:', questionIds); // Log danh sách ID câu hỏi
      return questionIds;

   } catch (error) {
      // Log chi tiết lỗi
      logger.error('Lỗi trong quá trình thêm hoặc tìm kiếm câu hỏi:', {
         message: error.message,
         stack: error.stack
      });
      throw new Error('Lỗi trong quá trình xử lý câu hỏi.');
   }
}


// Lấy tất cả bài kiểm tra của Instructor hiện tại
export async function getAllTests(req, res) {
   try {
      const tests = await TestModel.find({ instructor: req.user.userId }).populate('questions_id');
      logger.info('Lấy danh sách bài kiểm tra.', { instructor: req.user.userId });

      res.status(200).json(tests);
   } catch (error) {
      logger.error('Lỗi khi lấy danh sách bài kiểm tra:', { error });
      res.status(500).json({ error: 'Lỗi khi lấy danh sách bài kiểm tra!' });
   }
}

// Lấy bài kiểm tra theo ID
export async function getTestById(req, res) {
   const { id } = req.params;

   try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
         logger.warn('ID không hợp lệ.', { id });
         return res.status(400).json({ error: 'ID không hợp lệ!' });
      }

      const test = await TestModel.findById(id).populate('questions_id').lean();

      if (!test) {
         logger.warn('Không tìm thấy bài kiểm tra.', { testId: id });
         return res.status(404).json({ error: 'Test not found!' });
      }

      logger.info('Bài kiểm tra tìm thấy.', { test });
      res.status(200).json(test);
   } catch (error) {
      logger.error('Lỗi khi lấy bài kiểm tra:', { error });
      res.status(500).json({ error: 'Lỗi khi lấy bài kiểm tra!' });
   }
}

// Xóa bài kiểm tra
export async function deleteTest(req, res) {
   const { id } = req.params;

   try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
         logger.warn('ID không hợp lệ.', { id });
         return res.status(400).json({ error: 'ID không hợp lệ!' });
      }

      const test = await TestModel.findById(id);

      if (!test) {
         logger.warn('Không tìm thấy bài kiểm tra để xóa.', { testId: id });
         return res.status(404).json({ error: 'Test not found!' });
      }

      await test.remove();
      logger.info('Xóa bài kiểm tra thành công.', { testId: id });

      res.status(200).json({ msg: 'Xóa bài kiểm tra thành công!' });
   } catch (error) {
      logger.error('Lỗi khi xóa bài kiểm tra:', { error });
      res.status(500).json({ error: 'Lỗi khi xóa bài kiểm tra!' });
   }
}

// Lấy bài làm của bài kiểm tra theo ID bài kiểm tra
export async function getSubmissionsByTestId(req, res) {
   const { test_id } = req.params;

   try {
      const submissions = await SubmissionModel.find({ _id_test: test_id })
         .populate('_id_user')
         .populate('_id_test');

      if (!submissions.length) {
         logger.warn('Không có bài làm cho bài kiểm tra.', { testId: test_id });
         return res.status(404).json({ message: 'No submissions found for this test' });
      }

      logger.info('Lấy bài làm thành công.', { submissions });
      res.status(200).json(submissions);
   } catch (error) {
      logger.error('Lỗi khi lấy bài làm:', { error });
      res.status(500).json({ error: 'Lỗi khi lấy bài làm!' });
   }
}

// Cập nhật bài kiểm tra theo ID
export async function updateTest(req, res) {
   const { id } = req.params; // Lấy ID bài kiểm tra từ URL
   logger.info('Nhận yêu cầu cập nhật bài kiểm tra.', { id, body: req.body });

   try {
      // Kiểm tra xem ID có hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(id)) {
         logger.warn('ID không hợp lệ.', { id });
         return res.status(400).json({ error: 'ID không hợp lệ!' });
      }

      const {
         title,
         description,
         duration,
         start_date,
         end_date,
         status,
         questions, // Danh sách câu hỏi mới (nếu có)
         grade_id,
         category_id,
         group_id,
         classRoom_id,
      } = req.body;

      // Lấy bài kiểm tra hiện tại từ DB
      const existingTest = await TestModel.findById(id);
      if (!existingTest) {
         logger.warn('Không tìm thấy bài kiểm tra để cập nhật.', { id });
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      // Nếu có câu hỏi mới, kiểm tra và thêm vào DB
      let updatedQuestionIds = existingTest.questions_id;
      if (questions && questions.length > 0) {
         // Tạo testData để truyền vào getExistingOrAddQuestions
         const testData = {
            grade_id: grade_id || existingTest.grade_id,
            category_id: category_id || existingTest.category_id,
            group_id: group_id || existingTest.group_id,
            classRoom_id: classRoom_id || existingTest.classRoom_id,
            instructor: existingTest.instructor,
         };

         const questionIds = await getExistingOrAddQuestions(questions, testData);
         updatedQuestionIds = [...new Set([...existingTest.questions_id, ...questionIds])];
      }

      // Cập nhật các trường của bài kiểm tra
      existingTest.title = title || existingTest.title;
      existingTest.description = description || existingTest.description;
      existingTest.duration = duration || existingTest.duration;
      existingTest.start_date = start_date || existingTest.start_date;
      existingTest.end_date = end_date || existingTest.end_date;
      existingTest.status = status || existingTest.status;
      existingTest.grade_id = grade_id || existingTest.grade_id;
      existingTest.category_id = category_id || existingTest.category_id;
      existingTest.group_id = group_id || existingTest.group_id;
      existingTest.classRoom_id = classRoom_id || existingTest.classRoom_id;
      existingTest.questions_id = updatedQuestionIds;

      // Lưu các thay đổi vào DB
      await existingTest.save();
      logger.info('Bài kiểm tra đã được cập nhật thành công.', { id });

      res.status(200).json({ msg: 'Cập nhật bài kiểm tra thành công!', test: existingTest });
   } catch (error) {
      logger.error('Lỗi khi cập nhật bài kiểm tra:', { message: error.message, stack: error.stack });
      res.status(500).json({ error: 'Lỗi khi cập nhật bài kiểm tra!' });
   }
}
