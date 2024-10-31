import mongoose from 'mongoose';  // Thêm import này nếu thiếu
import QuestionModel from '../model/Question.model.js';
import XLSX from 'xlsx';
import logger from '../utils/logger.js'; // Sử dụng winston để ghi log
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
// Tạo nhiều câu hỏi cùng lúc
export async function createMultipleQuestions(req, res) {
   try {
      logger.info('Nhận yêu cầu tạo nhiều câu hỏi:', req.body);

      const questionsData = req.body;

      if (!Array.isArray(questionsData) || questionsData.length === 0) {
         logger.warn('Không có câu hỏi để thêm.');
         return res.status(400).json({ error: 'Không có câu hỏi nào để thêm.' });
      }

      const validatedQuestions = questionsData.map((question) => {
         const { grade_id, category_id, group_id, options } = question;

         if (
            !mongoose.Types.ObjectId.isValid(grade_id) ||
            !mongoose.Types.ObjectId.isValid(category_id) ||
            !mongoose.Types.ObjectId.isValid(group_id)
         ) {
            throw new Error(`ID không hợp lệ: grade_id=${grade_id}, category_id=${category_id}, group_id=${group_id}`);
         }

         if (options.length < 2) {
            throw new Error('Mỗi câu hỏi cần ít nhất 2 đáp án.');
         }

         return { ...question, instructor: req.user.userId };
      });

      const addedQuestions = await QuestionModel.insertMany(validatedQuestions);
      logger.info('Câu hỏi đã được thêm:', addedQuestions);

      res.status(201).json({ msg: 'Thêm câu hỏi thành công!', questions: addedQuestions });
   } catch (error) {
      logger.error('Lỗi khi thêm nhiều câu hỏi:', error);
      res.status(500).json({ error: `Lỗi khi thêm câu hỏi: ${error.message}` });
   }
}
// Cập nhật câu hỏi theo ID
export async function updateQuestion(req, res) {
   try {
      const questionId = req.params.id;
      logger.info(`Yêu cầu cập nhật câu hỏi ID: ${questionId}`);

      const question = await QuestionModel.findByIdAndUpdate(
         questionId,
         req.body,
         { new: true }
      );

      if (!question) {
         logger.warn(`Không tìm thấy câu hỏi với ID: ${questionId}`);
         return res.status(404).json({ error: 'Không tìm thấy câu hỏi!' });
      }

      res.status(200).json({ msg: 'Cập nhật câu hỏi thành công!', question });
   } catch (error) {
      logger.error('Lỗi khi cập nhật câu hỏi:', error);
      res.status(500).json({ error: 'Lỗi khi cập nhật câu hỏi!' });
   }
}

/// Xóa câu hỏi theo ID
export async function deleteQuestion(req, res) {
   try {
      const questionId = req.params.id;
      logger.info(`Yêu cầu xóa câu hỏi ID: ${questionId}`);

      const question = await QuestionModel.findByIdAndDelete(questionId);

      if (!question) {
         logger.warn(`Không tìm thấy câu hỏi với ID: ${questionId}`);
         return res.status(404).json({ error: 'Không tìm thấy câu hỏi!' });
      }

      res.status(200).json({ msg: 'Xóa câu hỏi thành công!' });
   } catch (error) {
      logger.error('Lỗi khi xóa câu hỏi:', error);
      res.status(500).json({ error: 'Lỗi khi xóa câu hỏi!' });
   }
}

// Upload questions from Excel
export async function addQuestionsFromExcel(req, res) {
   try {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const questions = rows.slice(1).map((row, index) => {
         const options = row.slice(1, row.length - 1).filter((opt) => opt !== undefined);
         const correctAnswers = row[row.length - 1].split(',').map((ans) => ans.trim());

         if (options.length < 2) {
            throw new Error(`Row ${index + 2}: At least 2 options are required.`);
         }

         correctAnswers.forEach((answer) => {
            if (!options.includes(answer)) {
               throw new Error(`Row ${index + 2}: Correct answer '${answer}' does not match any options.`);
            }
         });

         return {
            question_text: row[0],
            options,
            correct_answers: correctAnswers,
            instructor: req.user.userId,
            question_type: 'multiple-choice',
         };
      });

      const addedQuestions = await QuestionModel.insertMany(questions);
      res.status(201).json({ msg: 'Questions added from Excel successfully!', questions: addedQuestions });
   } catch (error) {
      logger.error('Error uploading questions from Excel:', error);
      res.status(500).json({ error: 'Failed to upload questions from Excel!' });
   }
}
// Lấy câu hỏi theo ID
export async function getQuestionById(req, res) {
   try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         logger.warn(`ID không hợp lệ: ${id}`);
         return res.status(400).json({ error: 'ID không hợp lệ!' });
      }

      const question = await QuestionModel.findById(id);
      if (!question) {
         logger.warn(`Không tìm thấy câu hỏi với ID: ${id}`);
         return res.status(404).json({ error: 'Không tìm thấy câu hỏi!' });
      }

      logger.info('Dữ liệu câu hỏi:', question);
      res.status(200).json(question);
   } catch (error) {
      logger.error('Lỗi khi lấy câu hỏi:', error);
      res.status(500).json({ error: 'Lỗi khi lấy câu hỏi!' });
   }
}


// Lấy tất cả câu hỏi do người dùng hiện tại tạo ra
export const getAllQuestions = async (req, res) => {
   try {
      const { gradeId, categoryId, groupId } = req.query;
      const filter = { instructor: req.user.userId }; // Lọc theo instructor

      if (gradeId) filter.grade_id = gradeId;
      if (categoryId) filter.category_id = categoryId;
      if (groupId) filter.group_id = groupId;

      const questions = await QuestionModel.find(filter)
         .populate('category_id', 'name')
         .populate('group_id', 'name')
         .populate('grade_id', 'name')
         .lean();

      if (questions.length === 0) {
         return res.status(404).json({ error: 'Không có câu hỏi nào được tìm thấy!' });
      }

      res.status(200).json(questions);
   } catch (error) {
      console.error('Lỗi khi lấy câu hỏi:', error);
      res.status(500).json({ error: 'Lỗi khi lấy câu hỏi!' });
   }
};



export async function getQuestionsByCategory(req, res) {
   try {
      const { categoryId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
         return res.status(400).json({ error: 'ID không hợp lệ!' });
      }

      const questions = await QuestionModel.find({
         category_id: categoryId,
         instructor: req.user.userId, // Lọc theo instructor hiện tại
      });

      if (questions.length === 0) {
         return res.status(404).json({ error: 'Không tìm thấy câu hỏi nào cho môn học này!' });
      }

      res.status(200).json(questions);
   } catch (error) {
      console.error('Lỗi khi lấy câu hỏi theo môn:', error);
      res.status(500).json({ error: 'Lỗi khi lấy câu hỏi theo môn!' });
   }
}


// Lấy câu hỏi theo Grade (Khối)
export async function getQuestionsByGrade(req, res) {
   try {
      const { gradeId } = req.params;

      // Kiểm tra nếu ID không hợp lệ
      if (!mongoose.Types.ObjectId.isValid(gradeId)) {
         console.log(`ID không hợp lệ: ${gradeId}`);
         return res.status(400).json({ error: "ID không hợp lệ!" });
      }

      const questions = await QuestionModel.find({ grade_id: gradeId });

      if (questions.length === 0) {
         console.log(`Không có câu hỏi nào thuộc Grade ID: ${gradeId}`);
         return res.status(404).json({ error: "Không tìm thấy câu hỏi nào cho khối này!" });
      }

      // Log danh sách câu hỏi ra terminal
      console.log('Danh sách câu hỏi theo Grade:', JSON.stringify(questions, null, 2));

      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy câu hỏi theo khối:", error);
      res.status(500).json({ error: "Lỗi khi lấy câu hỏi theo khối!" });
   }
}

// Lấy câu hỏi theo Group (Chương)
export async function getQuestionsByGroup(req, res) {
   try {
      const { groupId } = req.params;

      // Kiểm tra nếu ID không hợp lệ
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
         console.log(`ID không hợp lệ: ${groupId}`);
         return res.status(400).json({ error: "ID không hợp lệ!" });
      }

      const questions = await QuestionModel.find({ group_id: groupId });

      if (questions.length === 0) {
         console.log(`Không có câu hỏi nào thuộc Group ID: ${groupId}`);
         return res.status(404).json({ error: "Không tìm thấy câu hỏi nào cho chương này!" });
      }

      // Log danh sách câu hỏi ra terminal
      console.log('Danh sách câu hỏi theo Group:', JSON.stringify(questions, null, 2));

      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy câu hỏi theo chương:", error);
      res.status(500).json({ error: "Lỗi khi lấy câu hỏi theo chương!" });
   }
}

// Lấy câu hỏi theo ClassRoom (Lớp)
export async function getQuestionsByClassRoom(req, res) {
   try {
      const questions = await QuestionModel.find({ classRoom_id: req.params.classRoomId });
      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy câu hỏi theo lớp:", error);
      res.status(500).json({ error: "Lỗi khi lấy câu hỏi theo lớp!" });
   }
}

// Lấy câu hỏi theo Test (Bài kiểm tra)
export async function getQuestionsByTest(req, res) {
   try {
      const questions = await QuestionModel.find({ test_id: req.params.testId });
      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy câu hỏi theo bài kiểm tra:", error);
      res.status(500).json({ error: "Lỗi khi lấy câu hỏi theo bài kiểm tra!" });
   }
}


// Lấy câu hỏi ngẫu nhiên theo khối, môn, chương với số lượng chỉ định
export async function getRandomQuestions(req, res) {
   try {
      const { groupId } = req.params; // Nhận group_id từ params
      const { quantity } = req.query; // Nhận số lượng câu hỏi từ query params

      // Kiểm tra nếu group_id hợp lệ
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
         return res.status(400).json({ error: "ID của chương không hợp lệ!" });
      }

      const limit = parseInt(quantity, 10) || 1; // Số lượng câu hỏi (mặc định là 1 nếu không truyền)

      // Tìm câu hỏi phù hợp và lấy ngẫu nhiên
      const questions = await QuestionModel.aggregate([
         { $match: { group_id: mongoose.Types.ObjectId(groupId) } }, // Lọc theo group_id
         { $sample: { size: limit } } // Lấy ngẫu nhiên số lượng `limit` câu hỏi
      ]);

      if (questions.length === 0) {
         return res.status(404).json({ error: "Không tìm thấy câu hỏi nào cho chương này!" });
      }

      res.status(200).json({ questions });
   } catch (error) {
      console.error("Lỗi khi lấy câu hỏi ngẫu nhiên:", error);
      res.status(500).json({ error: "Lỗi khi lấy câu hỏi ngẫu nhiên!" });
   }
}