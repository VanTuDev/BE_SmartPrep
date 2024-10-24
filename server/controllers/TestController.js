import mongoose from 'mongoose';
import xlsx from 'xlsx';
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
// Tạo bài kiểm tra với câu hỏi trực tiếp, ngẫu nhiên, từ Excel hoặc thêm từng câu hỏi mới
export async function createTest(req, res) {
   try {
      const {
         title, description, duration, start_date, end_date, status,
         grade_id, category_id, group_id, classRoom_id, numQuestions, questions, newQuestions
      } = req.body;
      const file = req.file;
      let questionIds = [];

      logger.info('Dữ liệu nhận từ client:', req.body);

      // Trường hợp câu hỏi trực tiếp
      if (questions && questions.length > 0) {
         questionIds = questions.map(q => q.question_id);
         logger.info(`Đã nhận ${ questionIds.length } câu hỏi từ client.`);
      }
      // Trường hợp random câu hỏi từ ngân hàng
      else if (numQuestions) {
         const filter = {};
         if (grade_id) filter.grade_id = grade_id;
         if (category_id) filter.category_id = category_id;
         if (group_id) filter.group_id = group_id;

         const allQuestions = await QuestionModel.find(filter);
         if (allQuestions.length < numQuestions) {
            logger.warn('Không đủ câu hỏi để tạo bài kiểm tra.');
            return res.status(400).json({ error: 'Không đủ câu hỏi để tạo bài kiểm tra!' });
         }

         const randomQuestions = allQuestions
            .sort(() => 0.5 - Math.random())
            .slice(0, numQuestions);
         questionIds = randomQuestions.map(q => q._id);
         logger.info(`Đã chọn ngẫu nhiên ${ questionIds.length } câu hỏi.`);
      }
      // Trường hợp upload câu hỏi từ Excel
      else if (file) {
         const workbook = xlsx.readFile(file.path);
         const sheetName = workbook.SheetNames[0];
         const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

         const excelQuestions = [];

         for (const row of sheetData) {
            const options = Object.keys(row)
               .filter(key => key.startsWith('Option'))
               .map(optionKey => row[optionKey])
               .filter(option => option);

            const newQuestion = new QuestionModel({
               question_text: row['Question Text'],
               question_type: row['Question Type'] || 'multiple-choice',
               options: options,
               correct_answers: row['Correct Answers'].split(',').map(ans => ans.trim()),
               instructor: req.user.userId,
               grade_id: grade_id || null,
               category_id: category_id || null,
               group_id: group_id || null,
               classRoom_id: classRoom_id ? [classRoom_id] : []
            });

            const savedQuestion = await newQuestion.save();
            excelQuestions.push(savedQuestion._id);
            logger.info(`Đã thêm câu hỏi mới từ Excel: ${ newQuestion.question_text }`);
         }
         questionIds = excelQuestions;
      }
      // Trường hợp thêm từng câu hỏi mới vào bài kiểm tra
      if (newQuestions && newQuestions.length > 0) {
         for (const question of newQuestions) {
            const newQuestion = new QuestionModel({
               question_text: question.question_text,
               question_type: question.question_type,
               options: question.options,
               correct_answers: question.correct_answers,
               instructor: req.user.userId,
               grade_id: grade_id || null,
               category_id: category_id || null,
               group_id: group_id || null,
               classRoom_id: classRoom_id ? [classRoom_id] : []
            });

            const savedQuestion = await newQuestion.save();
            questionIds.push(savedQuestion._id);
            logger.info(`Đã thêm câu hỏi mới vào bài kiểm tra: ${ newQuestion.question_text }`);
         }
      }

      // Tạo bài kiểm tra mới
      const newTest = new TestModel({
         title,
         description,
         questions_id: questionIds,
         duration,
         start_date,
         end_date,
         grade_id: grade_id || null,
         category_id: category_id || null,
         group_id: group_id || null,
         classRoom_id: classRoom_id || null,
         status: status || 'draft',
         instructor: req.user.userId
      });

      await newTest.save();
      logger.info(`Bài kiểm tra mới đã được tạo: ${ newTest.title }`);

      res.status(201).json({
         msg: 'Bài kiểm tra đã được tạo thành công!',
         test: newTest
      });
   } catch (error) {
      logger.error('Lỗi khi tạo bài kiểm tra:', error);
      res.status(500).json(`{ error: Lỗi khi tạo bài kiểm tra: ${ error.message } }`);
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
      const test = await TestModel.findById(req.params.id).populate('questions_id').lean();

      if (!test) {
         logger.warn(`Không tìm thấy bài kiểm tra với ID: ${req.params.id}`);
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