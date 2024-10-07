import TestModel from '../model/Test.model.js';
import QuestionModel from '../model/Question.model.js';
import CategoryModel from '../model/Category.model.js';
import UserModel from '../model/User.model.js';


export async function createTest(req, res) {
   try {

      res.status(200).json({ msg: "tạo bài kiểm tra thành công!" });
   } catch (error) {
      console.error("Lỗi khi tạo bài kiểm tra:", error);
      res.status(500).json({ error: "Lỗi khi tạo bài kiểm tra!" });
   }
}


export async function getAllTest(req, res) {
   try {

      res.status(200).json({ msg: "lấy danh sách bài kiểm tra thành công!" });
   } catch (error) {
      console.error("Lỗi khi lấy danh sách bài kiểm tra:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách bài kiểm tra!" });
   }
}

export async function getTestByCategoryId(req, res) {
   try {

      res.status(200).json({ msg: "lấy danh sách bài kiểm tra theo danh mục thành công!" });
   } catch (error) {
      console.error("Lỗi khi lấy danh sách bài kiểm tra theo danh mục:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách bài kiểm tra theo danh mục!" });
   }
}

export async function updateTest(req, res) {
   try {


      res.status(200).json({ msg: "cập nhật bài kiểm tra thành công!" });
   } catch (error) {
      console.error("Lỗi khi cập nhật bài kiểm tra:", error);
      return res.status(500).json({ error: "Lỗi khi cập nhật bài kiểm tra" });
   }
}

export async function deleteTest(req, res) {
   try {

      res.status(200).json({ msg: "Xóa bài kiểm tra thành công!" });
   } catch (error) {
      console.error("Lỗi khi xóa bài kiểm tra:", error);
      res.status(500).json({ error: "Lỗi khi xóa bài kiểm tra!" });
   }
}

// Hàm để tạo bài kiểm tra với câu hỏi bốc ngẫu nhiên
export async function createTestWithRandomQuestions(req, res) { 
   try {
      const { title, description, duration, access_type, start_date, end_date, time_do, invite_users, access_link } = req.body;

      // Kiểm tra các trường bắt buộc
      if (!title || !description || !duration || !start_date || !end_date || !time_do || !access_link) {
         return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ thông tin!" });
      }

      // Bốc ngẫu nhiên câu hỏi từ thư viện câu hỏi
      const allQuestions = await QuestionModel.find({}); // Lấy tất cả câu hỏi
      const randomQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5); // Lấy 5 câu hỏi ngẫu nhiên

      // Tạo bài kiểm tra mới
      const newTest = new TestModel({
         title,
         description,
         user_id: req.user.userId, // ID của instructor
         questions: randomQuestions.map(q => ({ question_id: q._id })), // Lưu ID của câu hỏi
         duration,
         access_type,
         start_date,
         end_date,
         time_do,
         invite_users,
         access_link,
         status: 'published' // Hoặc 'draft' tùy theo nhu cầu
      });

      await newTest.save(); // Lưu bài kiểm tra vào cơ sở dữ liệu
      res.status(201).json({ msg: "Bài kiểm tra đã được tạo thành công!", test: newTest });
   } catch (error) {
      console.error("Lỗi khi tạo bài kiểm tra:", error);
      res.status(500).json({ error: "Lỗi khi tạo bài kiểm tra!" });
   }
}