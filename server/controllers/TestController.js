import mongoose from 'mongoose';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import TestModel from '../model/Test.model.js';
import QuestionModel from '../model/Question.model.js';
import logger from '../utils/logger.js'; // Winston logger

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

// Tạo bài kiểm tra với câu hỏi trực tiếp, ngẫu nhiên hoặc từ Excel
export async function createTest(req, res) {
   try {
      logger.info('Nhận yêu cầu tạo bài kiểm tra...', { body: req.body, user: req.user });
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

      // Kiểm tra nếu thiếu thông tin bắt buộc
      if (!title || !description || !duration || !start_date || !end_date) {
         logger.warn('Thiếu thông tin bắt buộc cho bài kiểm tra.', { body: req.body });
         return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
      }

      // Kiểm tra ObjectId hợp lệ
      if (
         !mongoose.Types.ObjectId.isValid(grade_id) ||
         !mongoose.Types.ObjectId.isValid(category_id) ||
         !mongoose.Types.ObjectId.isValid(group_id)
      ) {
         logger.warn('ID không hợp lệ.', { grade_id, category_id, group_id });
         return res.status(400).json({ error: 'ID không hợp lệ cho grade, category hoặc group!' });
      }

      // Log trước khi tạo bài kiểm tra
      logger.info('Đang tạo bài kiểm tra mới...', {
         title,
         description,
         instructor: req.user.userId
      });

      // Tạo bài kiểm tra mới
      const newTest = new TestModel({
         title,
         description,
         questions_id: [], // Cho phép rỗng ban đầu
         duration,
         start_date,
         end_date,
         status: status || 'draft',
         grade_id,
         category_id,
         group_id,
         classRoom_id: classRoom_id || null,
         instructor: req.user.userId
      });

      await newTest.save();
      logger.info('Bài kiểm tra đã được tạo thành công!', { testId: newTest._id });

      res.status(201).json({ msg: 'Tạo bài kiểm tra thành công!', test: newTest });
   } catch (error) {
      logger.error('Lỗi khi tạo bài kiểm tra:', { message: error.message, stack: error.stack });
      res.status(500).json({ error: `Không thể tạo bài kiểm tra: ${error.message}` });
   }
}



export async function uploadQuestionsExcel(req, res) {
   try {
      console.log(req.file); // Kiểm tra xem file đã được upload thành công

      if (!req.file) {
         return res.status(400).json({ error: 'Không có file nào được upload!' });
      }

      const { testId } = req.params;

      const test = await TestModel.findById(testId);
      if (!test) {
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      // Đọc file từ đường dẫn đã lưu trên đĩa
      const filePath = path.resolve(req.file.path);
      console.log(`Đọc file từ đường dẫn: ${filePath}`);

      const workbook = xlsx.readFile(filePath); // Đọc trực tiếp từ file trên ổ đĩa
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!worksheet) {
         return res.status(400).json({ error: 'Không tìm thấy worksheet trong file Excel!' });
      }

      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length <= 1) {
         return res.status(400).json({ error: 'File Excel không có dữ liệu hợp lệ!' });
      }

      const questions = await Promise.all(
         rows.slice(1).map(async (row, index) => {
            try {
               if (!row[0]) {
                  console.warn(`Bỏ qua hàng ${index + 2} vì không có câu hỏi.`);
                  return null;
               }

               const questionText = row[0];
               const existingQuestion = await QuestionModel.findOne({
                  question_text: questionText,
                  instructor: req.user.userId,
               });

               if (existingQuestion) {
                  return existingQuestion;
               }

               const newQuestion = new QuestionModel({
                  question_text: questionText,
                  options: row.slice(1, row.length - 1).filter((opt) => opt),
                  correct_answers: row[row.length - 1].split(',').map((ans) => ans.trim()),
                  question_type: 'multiple-choice',
                  instructor: req.user.userId,
               });

               return await newQuestion.save();
            } catch (innerError) {
               console.error(`Lỗi khi xử lý hàng ${index + 2}:`, innerError);
               return null;
            }
         })
      );

      const validQuestions = questions.filter((q) => q !== null);
      const questionIds = validQuestions.map((q) => q._id);

      if (questionIds.length > 0) {
         await TestModel.findByIdAndUpdate(
            testId,
            { $push: { questions_id: { $each: questionIds } } },
            { new: true }
         );
      }

      res.status(201).json({ msg: 'Câu hỏi từ Excel đã được thêm vào bài kiểm tra!', questions: validQuestions });
   } catch (error) {
      console.error('Lỗi khi đọc file Excel:', error);
      res.status(500).json({ error: 'Không thể đọc file Excel!' });
   } finally {
      // Xóa file sau khi đọc xong
      if (req.file && req.file.path) {
         fs.unlink(req.file.path, (err) => {
            if (err) console.error('Lỗi khi xóa file:', err);
         });
      }
   }
}

export async function getRandomQuestions(req, res) {
   try {
      const { testId } = req.params;
      const { grade_id, category_id, group_id, numQuestions } = req.body;

      // Kiểm tra bài kiểm tra có tồn tại không
      const test = await TestModel.findById(testId);
      if (!test) {
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      // Lấy danh sách câu hỏi đã có trong bài kiểm tra
      const existingQuestionIds = test.questions_id.map(id => id.toString());

      // Tạo bộ lọc dựa trên các tiêu chí
      const filter = {};
      if (grade_id) filter.grade_id = grade_id;
      if (category_id) filter.category_id = category_id;
      if (group_id) filter.group_id = group_id;

      // Lấy tất cả câu hỏi dựa trên bộ lọc
      const allQuestions = await QuestionModel.find(filter);

      // Loại bỏ các câu hỏi đã có trong bài kiểm tra
      const availableQuestions = allQuestions.filter(
         q => !existingQuestionIds.includes(q._id.toString())
      );

      // Kiểm tra nếu số lượng câu hỏi không đủ
      if (availableQuestions.length < numQuestions) {
         return res.status(400).json({ error: 'Không đủ câu hỏi để random!' });
      }

      // Random câu hỏi từ những câu hỏi còn lại
      const randomQuestions = availableQuestions
         .sort(() => 0.5 - Math.random()) // Shuffle mảng câu hỏi
         .slice(0, numQuestions); // Lấy số câu hỏi theo yêu cầu

      // Lấy ID của các câu hỏi random
      const questionIds = randomQuestions.map(q => q._id);

      // Thêm các câu hỏi vào bài kiểm tra
      await TestModel.findByIdAndUpdate(
         testId,
         { $push: { questions_id: { $each: questionIds } } },
         { new: true }
      );

      // Trả về danh sách câu hỏi đã thêm
      res.status(200).json({
         msg: 'Câu hỏi đã được random và thêm vào bài kiểm tra!',
         questions: randomQuestions
      });
   } catch (error) {
      logger.error('Lỗi khi random câu hỏi:', error);
      res.status(500).json({ error: 'Không thể random câu hỏi!' });
   }
}

// Thêm câu hỏi mới vào ngân hàng câu hỏi
export async function addSingleQuestion(req, res) {
   try {
      const { testId } = req.params;
      const { question_text, options, correct_answers, grade_id, category_id, group_id, classRoom_id } = req.body;

      logger.info('Nhận yêu cầu thêm câu hỏi.', { testId, body: req.body });

      // Kiểm tra ObjectId hợp lệ
      if (
         !mongoose.Types.ObjectId.isValid(grade_id) ||
         !mongoose.Types.ObjectId.isValid(category_id) ||
         !mongoose.Types.ObjectId.isValid(group_id)
      ) {
         logger.warn('ID không hợp lệ cho grade, category hoặc group!', { grade_id, category_id, group_id });
         return res.status(400).json({ error: 'ID không hợp lệ cho grade, category hoặc group!' });
      }

      // Kiểm tra bài kiểm tra tồn tại
      const test = await TestModel.findById(testId);
      if (!test) {
         logger.warn('Không tìm thấy bài kiểm tra.', { testId });
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      // Kiểm tra nếu câu hỏi đã tồn tại
      const existingQuestion = await QuestionModel.findOne({
         question_text,
         instructor: req.user.userId
      });

      if (existingQuestion) {
         logger.warn('Câu hỏi đã tồn tại.', { question_text });

         // Thêm ID câu hỏi vào bài kiểm tra nếu chưa có
         if (!test.questions_id.includes(existingQuestion._id)) {
            await TestModel.findByIdAndUpdate(
               testId,
               { $push: { questions_id: existingQuestion._id } },
               { new: true }
            );
            return res.status(200).json({
               msg: 'Câu hỏi đã tồn tại và được thêm vào bài kiểm tra!',
               questionId: existingQuestion._id
            });
         } else {
            return res.status(400).json({ error: 'Câu hỏi đã tồn tại trong bài kiểm tra!' });
         }
      }

      // Kiểm tra dữ liệu câu hỏi
      if (!question_text || options.length < 2) {
         logger.warn('Câu hỏi không hợp lệ.', { question_text, options });
         return res.status(400).json({ error: 'Câu hỏi phải có ít nhất 2 đáp án!' });
      }

      correct_answers.forEach(answer => {
         if (!options.includes(answer)) {
            logger.warn('Đáp án không khớp với danh sách đáp án.', { answer, options });
            throw new Error(`Đáp án '${answer}' không khớp với danh sách đáp án!`);
         }
      });

      // Tạo câu hỏi mới
      const newQuestion = new QuestionModel({
         question_text,
         options,
         correct_answers,
         question_type: 'multiple-choice',
         grade_id,
         category_id,
         group_id,
         classRoom_id,
         instructor: req.user.userId
      });

      const savedQuestion = await newQuestion.save();
      logger.info('Câu hỏi mới được tạo thành công.', { questionId: savedQuestion._id });

      // Thêm câu hỏi vào bài kiểm tra
      await TestModel.findByIdAndUpdate(
         testId,
         { $push: { questions_id: savedQuestion._id } },
         { new: true }
      );

      res.status(201).json({ msg: 'Câu hỏi được thêm thành công vào bài kiểm tra!', question: savedQuestion });
   } catch (error) {
      logger.error('Lỗi khi thêm câu hỏi:', { message: error.message, stack: error.stack });
      res.status(500).json({ error: `Không thể thêm câu hỏi: ${error.message}` });
   }
}

// Cập nhật bài kiểm tra
export async function updateTest(req, res) {
   try {
      const { examId } = req.params;
      const updatedData = req.body;

      const updatedTest = await TestModel.findByIdAndUpdate(examId, updatedData, { new: true });

      if (!updatedTest) {
         logger.warn(`Không tìm thấy bài kiểm tra với ID: ${examId}`);
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      logger.info(`Bài kiểm tra đã được cập nhật: ${updatedTest.title}`);
      res.status(200).json({ msg: 'Cập nhật bài kiểm tra thành công!', test: updatedTest });
   } catch (error) {
      logger.error('Lỗi khi cập nhật bài kiểm tra:', error);
      res.status(500).json({ error: `Lỗi khi cập nhật bài kiểm tra: ${error.message}` });
   }
}

// Lấy bài kiểm tra theo ID
export async function getTestById(req, res) {
   try {
      const test = await TestModel.findById(req.params.id)
         .populate('questions_id')
         .lean();

      if (!test) {
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      res.status(200).json(test);
   } catch (error) {
      logger.error('Lỗi khi lấy bài kiểm tra:', error);
      res.status(500).json({ error: 'Lỗi khi lấy bài kiểm tra!' });
   }
}


// Xóa bài kiểm tra
export async function deleteTest(req, res) {
   try {
      const test = await TestModel.findById(req.params.id);
      if (!test) {
         logger.warn(`Không tìm thấy bài kiểm tra với ID: ${req.params.id}`);
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      await test.remove();
      logger.info(`Đã xóa bài kiểm tra với ID: ${req.params.id}`);
      res.status(200).json({ msg: 'Xóa bài kiểm tra thành công!' });
   } catch (error) {
      logger.error('Lỗi khi xóa bài kiểm tra:', error);
      res.status(500).json({ error: 'Lỗi khi xóa bài kiểm tra!' });
   }
}

// Hàm lấy tất cả bài kiểm tra
export async function getAllTests(req, res) {
   try {
      const { grade_id, category_id, group_id, classRoom_id } = req.query;
      const filter = {}; // Bộ lọc bài kiểm tra

      if (grade_id) filter.grade_id = grade_id;
      if (category_id) filter.category_id = category_id;
      if (group_id) filter.group_id = group_id;
      if (classRoom_id) filter.classRoom_id = classRoom_id;

      const tests = await TestModel.find(filter).populate('instructor').lean();
      logger.info(`Đã lấy ${tests.length} bài kiểm tra.`);
      res.status(200).json(tests);
   } catch (error) {
      logger.error('Lỗi khi lấy danh sách bài kiểm tra:', error);
      res.status(500).json({ error: 'Lỗi khi lấy danh sách bài kiểm tra!' });
   }
}

// Hàm lấy tất cả bài làm của một bài kiểm tra
export async function getSubmissionsByTestId(req, res) {
   try {
      const { test_id } = req.params;

      const submissions = await SubmissionModel.find({ _id_test: test_id })
         .populate('_id_user', 'name email') // Lấy thông tin người dùng
         .populate('_id_test', 'title') // Lấy thông tin bài kiểm tra
         .lean();

      if (!submissions.length) {
         logger.warn(`Không tìm thấy bài làm cho bài kiểm tra với ID: ${test_id}`);
         return res.status(404).json({ message: 'Không tìm thấy bài làm nào!' });
      }

      logger.info(`Đã lấy ${submissions.length} bài làm cho bài kiểm tra với ID: ${test_id}`);
      res.status(200).json(submissions);
   } catch (error) {
      logger.error('Lỗi khi lấy bài làm:', error);
      res.status(500).json({ error: `Lỗi khi lấy bài làm: ${error.message}` });
   }
}

export async function updateTestStatus(req, res, next) {
   try {
      const { testId } = req.params;
      const test = await TestModel.findById(testId);

      if (!test) {
         return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra!' });
      }

      const currentDate = new Date();

      let newStatus = test.status;

      if (currentDate < test.start_date) {
         newStatus = 'published'; // Bài kiểm tra đã được public nhưng chưa bắt đầu
      } else if (currentDate >= test.start_date && currentDate <= test.end_date) {
         newStatus = 'start'; // Bài kiểm tra đang diễn ra
      } else if (currentDate > test.end_date) {
         newStatus = 'end'; // Bài kiểm tra đã kết thúc
      }

      if (newStatus !== test.status) {
         test.status = newStatus;
         await test.save();
      }

      next();
   } catch (error) {
      console.error('Lỗi khi cập nhật status:', error);
      res.status(500).json({ error: 'Không thể cập nhật status!' });
   }
}
