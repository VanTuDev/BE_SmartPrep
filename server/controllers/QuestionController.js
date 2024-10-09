import QuestionModel from '../model/Question.model.js';
import XLSX from 'xlsx';

// Middleware để kiểm tra quyền của Instructor
export function verifyInstructorRole(req, res, next) {
   const { role } = req.user;
   console.log("Xác thực quyền Instructor:", role); // Log quyền của người dùng hiện tại
   if (role !== 'instructor') {
      console.log("Người dùng không có quyền Instructor."); // Log khi không có quyền
      return res.status(403).json({ error: "Chỉ có Instructor mới có quyền này!" });
   }
   next();
}

// Tạo câu hỏi mới
export async function createQuestion(req, res) {
   try {
      const newQuestion = new QuestionModel({
         ...req.body,
         created_by: req.user.userId,
      });

      await newQuestion.save();
      console.log('Câu hỏi đã được tạo thành công:', newQuestion);
      res.status(201).json({ msg: 'Câu hỏi đã được tạo thành công!', question: newQuestion });
   } catch (error) {
      console.error('Lỗi khi tạo câu hỏi:', error);
      res.status(500).json({ error: 'Lỗi khi tạo câu hỏi!' });
   }
}

// Lấy tất cả các câu hỏi của Instructor hiện tại
export async function getAllQuestions(req, res) {
   try {
      const questions = await QuestionModel.find({ created_by: req.user.userId });
      console.log("Danh sách câu hỏi:", questions);
      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách câu hỏi:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách câu hỏi!" });
   }
}

// Lấy câu hỏi theo ID
export async function getQuestionById(req, res) {
   try {
      console.log("Request ID:", req.params.id); // Log ID của câu hỏi được yêu cầu
      const question = await QuestionModel.findById(req.params.id);

      // Kiểm tra quyền truy cập
      if (!question || question.created_by.toString() !== req.user.userId) {
         console.log("Bạn không có quyền truy cập câu hỏi này hoặc câu hỏi không tồn tại."); // Log nếu không có quyền truy cập
         return res.status(403).json({ error: "Bạn không có quyền truy cập câu hỏi này!" });
      }

      console.log("Câu hỏi tìm thấy:", question); // Log câu hỏi tìm được
      res.status(200).json(question);
   } catch (error) {
      console.error("Lỗi khi lấy câu hỏi:", error); // Log lỗi khi lấy câu hỏi
      res.status(500).json({ error: "Lỗi khi lấy câu hỏi!" });
   }
}

// Lấy tất cả câu hỏi theo danh mục
export async function getQuestionsByCategory(req, res) {
   try {
      const { categoryId } = req.params; // Lấy ID danh mục từ tham số
      console.log("Request Category ID:", categoryId); // Log ID danh mục

      const questions = await QuestionModel.find({ category: categoryId });

      // Kiểm tra nếu không có câu hỏi nào trong danh mục
      if (!questions.length) {
         console.log("Hiện chưa có câu hỏi trong danh mục này."); // Log thông báo
         return res.status(200).json({ msg: "Hiện chưa có câu hỏi trong danh mục này.", questions: [] });
      }

      console.log("Danh sách câu hỏi theo danh mục:", questions); // Log danh sách câu hỏi tìm được
      res.status(200).json(questions);
   } catch (error) {
      console.error("Lỗi khi lấy danh sách câu hỏi theo danh mục:", error); // Log lỗi
      res.status(500).json({ error: "Lỗi khi lấy danh sách câu hỏi theo danh mục!" });
   }
}


// Cập nhật câu hỏi

export async function updateQuestion(req, res) {
   try {
      console.log("Request ID để cập nhật:", req.params.id); // Log ID của câu hỏi cần cập nhật
      const question = await QuestionModel.findById(req.params.id);

      // Kiểm tra quyền cập nhật
      if (!question || question.created_by.toString() !== req.user.userId) {
         console.log("Bạn không có quyền cập nhật câu hỏi này hoặc câu hỏi không tồn tại."); // Log nếu không có quyền cập nhật
         return res.status(403).json({ error: "Bạn không có quyền cập nhật câu hỏi này!" });
      }

      Object.assign(question, req.body);
      await question.save();
      console.log("Câu hỏi đã được cập nhật:", question); // Log câu hỏi đã cập nhật thành công
      res.status(200).json({ msg: "Cập nhật câu hỏi thành công!", question });
   } catch (error) {
      console.error("Lỗi khi cập nhật câu hỏi:", error); // Log lỗi khi cập nhật
      res.status(500).json({ error: "Lỗi khi cập nhật câu hỏi!" });
   }
}



// Xóa câu hỏi
export async function deleteQuestion(req, res) {
   try {
      console.log("Request ID để xóa:", req.params.id); // Log ID của câu hỏi cần xóa
      const question = await QuestionModel.findById(req.params.id);

      // Kiểm tra quyền xóa
      if (!question || question.created_by.toString() !== req.user.userId) {
         console.log("Bạn không có quyền xóa câu hỏi này hoặc câu hỏi không tồn tại."); // Log nếu không có quyền xóa
         return res.status(403).json({ error: "Bạn không có quyền xóa câu hỏi này!" });
      }

      await question.remove();
      console.log("Xóa câu hỏi thành công với ID:", req.params.id); // Log khi xóa thành công
      res.status(200).json({ msg: "Xóa câu hỏi thành công!" });
   } catch (error) {
      console.error("Lỗi khi xóa câu hỏi:", error); // Log lỗi khi xóa
      res.status(500).json({ error: "Lỗi khi xóa câu hỏi!" });
   }
}

// Thêm câu hỏi bằng file Excel
export async function addQuestionsFromExcel(req, res) {
   try {
      console.log("Bắt đầu thêm câu hỏi từ file Excel...");

      // Kiểm tra nếu không có file nào được tải lên
      if (!req.file) {
         console.log("Không tìm thấy file tải lên.");
         return res.status(400).json({ error: "Vui lòng tải lên một tệp Excel." });
      }

      console.log("File đã được tải lên:", req.file.originalname);

      // Đọc file Excel và chuyển đổi thành định dạng JSON
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log("Dữ liệu từ file Excel:", rows);

      const addedQuestions = [];

      // Duyệt từng hàng dữ liệu, bỏ qua dòng đầu tiên là tiêu đề
      for (let i = 1; i < rows.length; i++) {
         const row = rows[i];
         const question_text = row[0]; // Cột chứa nội dung câu hỏi
         const options = row.slice(1, row.length - 1); // Các cột từ thứ 2 đến cột gần cuối là các options
         const correct_answers = row[row.length - 1].split(',').map(answer => answer.trim()); // Cột cuối cùng chứa correct_answers, ngăn cách bởi dấu phẩy

         // Tạo đối tượng câu hỏi mới
         const newQuestion = new QuestionModel({
            question_text, // Nội dung câu hỏi
            question_type: 'multiple-choice', // Loại câu hỏi là multiple-choice
            options, // Các lựa chọn cho câu hỏi
            correct_answers, // Đáp án đúng
            created_by: req.user.userId, // Người tạo
         });

         // Lưu câu hỏi vào cơ sở dữ liệu
         await newQuestion.save();
         console.log("Câu hỏi mới đã được thêm:", newQuestion);
         addedQuestions.push(newQuestion);
      }

      console.log("Tất cả câu hỏi đã được thêm:", addedQuestions);

      // Trả về phản hồi với các câu hỏi đã được thêm thành công
      return res.status(201).json({ msg: "Thêm câu hỏi từ file Excel thành công!", questions: addedQuestions });
   } catch (error) {
      console.error("Lỗi khi thêm câu hỏi từ file Excel:", error);
      return res.status(500).json({ error: "Lỗi khi thêm câu hỏi từ file Excel." });
   }
}

// Thêm nhiều câu hỏi
export async function createMultipleQuestions(req, res) {
   try {
      const questionsData = req.body; // Giả định rằng dữ liệu là mảng các câu hỏi

      // Kiểm tra nếu không có câu hỏi nào được gửi
      if (!Array.isArray(questionsData) || questionsData.length === 0) {
         return res.status(400).json({ error: "Không có câu hỏi nào để thêm." });
      }

      // Tạo mảng để lưu các câu hỏi mới
      const addedQuestions = [];

      // Lặp qua từng câu hỏi và tạo mới
      for (const questionData of questionsData) {
         const newQuestion = new QuestionModel({
            ...questionData,
            created_by: req.user.userId, // Gán ID của người tạo
         });
         await newQuestion.save();
         addedQuestions.push(newQuestion);
      }

      console.log('Đã thêm các câu hỏi mới:', addedQuestions);
      res.status(201).json({ msg: 'Thêm câu hỏi thành công!', questions: addedQuestions });
   } catch (error) {
      console.error('Lỗi khi thêm nhiều câu hỏi:', error);
      res.status(500).json({ error: 'Lỗi khi thêm nhiều câu hỏi.' });
   }
}

